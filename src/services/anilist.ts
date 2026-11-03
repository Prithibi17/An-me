import type { Anime } from '../types/anime.ts';

const ANILIST_URL = 'https://graphql.anilist.co';

const ANIME_FIELDS = `
  id
  idMal
  title {
    romaji
    english
    native
    userPreferred
  }
  coverImage {
    large
    medium
    color
  }
  bannerImage
  description
  format
  status
  episodes
  duration
  genres
  synonyms
  isAdult
  averageScore
  popularity
  season
  seasonYear
  nextAiringEpisode {
    airingAt
    timeUntilAiring
    episode
  }
  streamingEpisodes {
    title
    thumbnail
    url
    site
  }
  studios(isMain: true) {
    nodes {
      name
      isAnimationStudio
    }
  }
`;

async function fetchAniList<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const response = await fetch(ANILIST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`AniList query failed: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(json.errors[0]?.message || 'GraphQL error');
  }

  return json.data;
}

export async function getTrendingAnime(page = 1, perPage = 10): Promise<Anime[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await fetchAniList<{ Page: { media: Anime[] } }>(query, { page, perPage });
  return data.Page.media;
}

export async function getPopularSeasonAnime(page = 1, perPage = 12): Promise<Anime[]> {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  let season = 'FALL';
  if (currentMonth >= 0 && currentMonth <= 2) season = 'WINTER';
  else if (currentMonth >= 3 && currentMonth <= 5) season = 'SPRING';
  else if (currentMonth >= 6 && currentMonth <= 8) season = 'SUMMER';

  const query = `
    query ($page: Int, $perPage: Int, $season: MediaSeason, $seasonYear: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: POPULARITY_DESC, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await fetchAniList<{ Page: { media: Anime[] } }>(query, { page, perPage, season, seasonYear: currentYear });
  return data.Page.media;
}

export async function getTopRatedAnime(page = 1, perPage = 10): Promise<Anime[]> {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: SCORE_DESC, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const data = await fetchAniList<{ Page: { media: Anime[] } }>(query, { page, perPage });
  return data.Page.media;
}

export async function getRecentlyUpdatedAnime(page = 1, perPage = 24): Promise<Anime[]> {
  // AniList restricts single-query pagination depth to 5,000 items (5,000 / 24 = 208 pages)
  const MAX_PAGE_DEPTH = 208;
  const safePage = Math.max(1, page);

  let query: string;
  let variables: Record<string, any>;

  if (safePage <= MAX_PAGE_DEPTH) {
    query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: UPDATED_AT_DESC, isAdult: false) {
            ${ANIME_FIELDS}
          }
        }
      }
    `;
    variables = { page: safePage, perPage };
  } else {
    // For 3-digit and 4-digit deep pagination (pages 209 to 5,000+),
    // query catalog depth dynamically across major sort categories so AniList never throws an out-of-bounds error
    const blockIndex = Math.floor((safePage - 1) / MAX_PAGE_DEPTH);
    const subPage = ((safePage - 1) % MAX_PAGE_DEPTH) + 1;

    const sortList = ['UPDATED_AT_DESC', 'POPULARITY_DESC', 'SCORE_DESC', 'FAVOURITES_DESC', 'START_DATE_DESC'];
    const selectedSort = sortList[blockIndex % sortList.length];

    query = `
      query ($page: Int, $perPage: Int, $sort: [MediaSort]) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: $sort, isAdult: false) {
            ${ANIME_FIELDS}
          }
        }
      }
    `;
    variables = { page: subPage, perPage, sort: [selectedSort] };
  }

  try {
    const data = await fetchAniList<{ Page: { media: Anime[] } }>(query, variables);
    if (data?.Page?.media && data.Page.media.length > 0) {
      return data.Page.media;
    }
  } catch (err) {
    console.warn(`[AniList] Page ${page} lookup warning:`, err);
  }

  // Graceful fallback for extreme deep pages
  const fallbackQuery = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: POPULARITY_DESC, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;
  const fallbackData = await fetchAniList<{ Page: { media: Anime[] } }>(fallbackQuery, {
    page: ((safePage - 1) % 50) + 1,
    perPage,
  });
  return fallbackData?.Page?.media || [];
}

export async function searchAnime(params: {
  search?: string;
  genre?: string;
  year?: number;
  season?: string;
  format?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}): Promise<Anime[]> {
  const {
    search,
    genre,
    year,
    season,
    format,
    sort = 'POPULARITY_DESC',
    page = 1,
    perPage = 20,
  } = params;

  const query = `
    query ($page: Int, $perPage: Int, $search: String, $genre: String, $seasonYear: Int, $season: MediaSeason, $format: MediaFormat, $sort: [MediaSort]) {
      Page(page: $page, perPage: $perPage) {
        media(
          type: ANIME
          search: $search
          genre: $genre
          seasonYear: $seasonYear
          season: $season
          format: $format
          sort: $sort
          isAdult: false
        ) {
          ${ANIME_FIELDS}
        }
      }
    }
  `;

  const variables: Record<string, any> = {
    page,
    perPage,
    sort: [sort],
  };

  if (search && search.trim()) variables.search = search.trim();
  if (genre && genre !== 'All') variables.genre = genre;
  if (year) variables.seasonYear = year;
  if (season && season !== 'All') variables.season = season;
  if (format && format !== 'All') variables.format = format;

  const data = await fetchAniList<{ Page: { media: Anime[] } }>(query, variables);
  return data.Page.media;
}

export async function getAnimeDetails(id: number): Promise<Anime> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${ANIME_FIELDS}
        characters(sort: ROLE, perPage: 8) {
          nodes {
            id
            name {
              full
              native
            }
            image {
              medium
              large
            }
            role
          }
        }
        relations {
          nodes {
            ${ANIME_FIELDS}
          }
        }
        recommendations(sort: RATING_DESC, perPage: 24) {
          nodes {
            mediaRecommendation {
              ${ANIME_FIELDS}
            }
          }
        }
      }
    }
  `;

  const data = await fetchAniList<{ Media: Anime }>(query, { id });
  return data.Media;
}

export async function getAiringSchedule(startOfWeek: number, endOfWeek: number): Promise<Array<{
  id: number;
  airingAt: number;
  timeUntilAiring: number;
  episode: number;
  media: Anime;
}>> {
  const query = `
    query ($airingAt_greater: Int, $airingAt_lesser: Int) {
      Page(page: 1, perPage: 50) {
        airingSchedules(airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser, sort: TIME) {
          id
          airingAt
          timeUntilAiring
          episode
          media {
            ${ANIME_FIELDS}
          }
        }
      }
    }
  `;

  const data = await fetchAniList<{
    Page: {
      airingSchedules: Array<{
        id: number;
        airingAt: number;
        timeUntilAiring: number;
        episode: number;
        media: Anime;
      }>;
    };
  }>(query, {
    airingAt_greater: startOfWeek,
    airingAt_lesser: endOfWeek,
  });

  return data.Page.airingSchedules.filter((item) => item.media);
}

export function getAnimeEpisodeCount(anime: Anime): number {
  if (anime.nextAiringEpisode?.episode) {
    return Math.max(1, anime.nextAiringEpisode.episode - 1);
  }
  if (anime.episodes && anime.episodes > 0) {
    return anime.episodes;
  }
  if (anime.streamingEpisodes && anime.streamingEpisodes.length > 0) {
    return anime.streamingEpisodes.length;
  }
  return 12;
}

export function getAnimeEpisodesList(anime: Anime): Array<{ number: number; title: string; thumbnail?: string }> {
  const total = getAnimeEpisodeCount(anime);
  const list: Array<{ number: number; title: string; thumbnail?: string }> = [];

  const streamMap = new Map<number, { title?: string; thumbnail?: string }>();
  if (anime.streamingEpisodes && anime.streamingEpisodes.length > 0) {
    anime.streamingEpisodes.forEach((ep) => {
      const match = (ep.title || '').match(/Episode\s+(\d+)(?:\s*[-:]\s*(.+))?/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num)) {
          streamMap.set(num, {
            title: match[2]?.trim() || `Episode ${num}`,
            thumbnail: ep.thumbnail,
          });
        }
      }
    });
  }

  for (let i = 1; i <= total; i++) {
    const stream = streamMap.get(i);
    list.push({
      number: i,
      title: stream?.title || `Episode ${i}`,
      thumbnail: stream?.thumbnail,
    });
  }

  return list;
}
