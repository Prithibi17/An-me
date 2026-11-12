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

  const json = await response.json().catch(() => null);

  if (!response.ok || json?.errors) {
    const errMsg = json?.errors?.[0]?.message || `AniList query failed: ${response.status} ${response.statusText}`;
    throw new Error(errMsg);
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
  genres?: string[];
  year?: number;
  season?: string;
  format?: string;
  formats?: string[];
  status?: string;
  country?: string;
  minScore?: number;
  sort?: string;
  page?: number;
  perPage?: number;
}): Promise<Anime[]> {
  const {
    search,
    genre,
    genres,
    year,
    season,
    format,
    formats,
    status,
    country,
    minScore,
    sort = 'POPULARITY_DESC',
    page = 1,
    perPage = 20,
  } = params;

  const query = `
    query (
      $page: Int,
      $perPage: Int,
      $search: String,
      $genre: String,
      $genre_in: [String],
      $seasonYear: Int,
      $season: MediaSeason,
      $format: MediaFormat,
      $format_in: [MediaFormat],
      $status: MediaStatus,
      $countryOfOrigin: CountryCode,
      $averageScore_greater: Int,
      $sort: [MediaSort]
    ) {
      Page(page: $page, perPage: $perPage) {
        media(
          type: ANIME
          search: $search
          genre: $genre
          genre_in: $genre_in
          seasonYear: $seasonYear
          season: $season
          format: $format
          format_in: $format_in
          status: $status
          countryOfOrigin: $countryOfOrigin
          averageScore_greater: $averageScore_greater
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

  // Multi-genre or single genre support
  if (genres && genres.length > 0) {
    const validGenres = genres.filter((g) => g && g !== 'All');
    if (validGenres.length === 1) {
      variables.genre = validGenres[0];
    } else if (validGenres.length > 1) {
      variables.genre_in = validGenres;
    }
  } else if (genre && genre !== 'All') {
    variables.genre = genre;
  }

  // Multi-format or single format support
  if (formats && formats.length > 0) {
    const validFormats = formats.filter((f) => f && f !== 'All');
    if (validFormats.length === 1) {
      variables.format = validFormats[0];
    } else if (validFormats.length > 1) {
      variables.format_in = validFormats;
    }
  } else if (format && format !== 'All') {
    variables.format = format;
  }

  if (year) variables.seasonYear = year;
  if (season && season !== 'All') variables.season = season;
  if (status && status !== 'All') variables.status = status;
  if (country && country !== 'All') variables.countryOfOrigin = country;
  if (minScore && minScore > 0) variables.averageScore_greater = minScore;

  const data = await fetchAniList<{ Page: { media: Anime[] } }>(query, variables);
  return data.Page.media;
}

export async function getAnimeDetails(id: number): Promise<Anime> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${ANIME_FIELDS}
        characters(sort: ROLE, perPage: 24) {
          edges {
            role
            node {
              id
              name {
                full
                native
              }
              image {
                medium
                large
              }
            }
          }
        }
        relations {
          edges {
            relationType
            node {
              id
              idMal
              title {
                romaji
                english
                native
                userPreferred
              }
              coverImage {
                extraLarge
                large
                medium
              }
              bannerImage
              format
              status
              episodes
            }
          }
        }
        recommendations(sort: RATING_DESC, perPage: 24) {
          nodes {
            mediaRecommendation {
              id
              idMal
              title {
                romaji
                english
                native
                userPreferred
              }
              coverImage {
                extraLarge
                large
                medium
              }
              bannerImage
              format
              status
              episodes
            }
          }
        }
      }
    }
  `;

  const data = await fetchAniList<{ Media: any }>(query, { id });
  const raw = data.Media;

  const characterNodes: CharacterItem[] = raw.characters?.edges?.map((edge: any) => ({
    id: edge.node.id,
    name: edge.node.name,
    image: edge.node.image,
    role: edge.role || 'CHARACTER',
  })) || raw.characters?.nodes || [];

  const relationNodes: Anime[] = raw.relations?.edges?.map((edge: any) => ({
    ...edge.node,
    relationType: edge.relationType,
  })) || raw.relations?.nodes || [];

  return {
    ...raw,
    characters: { nodes: characterNodes },
    relations: { nodes: relationNodes },
  };
}

export async function getAiringSchedule(startOfWeek: number, endOfWeek: number): Promise<Array<{
  id: number;
  airingAt: number;
  timeUntilAiring: number;
  episode: number;
  media: Anime;
}>> {
  const query = `
    query ($airingAt_greater: Int, $airingAt_lesser: Int, $page: Int) {
      Page(page: $page, perPage: 50) {
        pageInfo {
          hasNextPage
        }
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

  const allSchedules: Array<{
    id: number;
    airingAt: number;
    timeUntilAiring: number;
    episode: number;
    media: Anime;
  }> = [];

  // Page through the weekly window so all 7 days are fully populated (AniList caps at 50/page)
  for (let page = 1; page <= 5; page++) {
    try {
      const data = await fetchAniList<{
        Page: {
          pageInfo: { hasNextPage: boolean };
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
        page,
      });

      const items = (data?.Page?.airingSchedules || []).filter((item) => item.media);
      allSchedules.push(...items);

      if (!data?.Page?.pageInfo?.hasNextPage || items.length < 50) {
        break;
      }
    } catch (err) {
      console.warn(`[getAiringSchedule] Page ${page} lookup warning:`, err);
      break;
    }
  }

  return allSchedules;
}

export function getAnimeEpisodeCount(anime: Anime): number {
  // 1. Verified available released episodes from provider
  const availableCount = Math.max(
    anime.subEpisodeCount || 0,
    anime.dubEpisodeCount || 0,
    anime.latestEpisodeNumber || 0
  );

  // 2. Airing countdown: if next episode is N, currently released is N - 1
  if (anime.nextAiringEpisode?.episode) {
    const nextAiring = Math.max(1, anime.nextAiringEpisode.episode - 1);
    if (availableCount > 0) {
      return Math.min(availableCount, nextAiring);
    }
    return nextAiring;
  }

  // 3. If currently releasing or unconfirmed status, never show unreleased upcoming episodes
  if (availableCount > 0 && (!anime.status || anime.status === 'RELEASING' || anime.status === 'NOT_YET_RELEASED')) {
    return availableCount;
  }

  if (anime.status === 'RELEASING' && availableCount > 0) {
    return availableCount;
  }

  // 4. If completed/finished, use full episodes count
  if (anime.episodes && anime.episodes > 0) {
    if (anime.status === 'RELEASING' && availableCount > 0) {
      return availableCount;
    }
    return anime.episodes;
  }

  if (availableCount > 0) {
    return availableCount;
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

  const anizipEps = anime.anizipEpisodes || {};

  for (let i = 1; i <= total; i++) {
    const stream = streamMap.get(i);
    const anizipEp = anizipEps[String(i)] || anizipEps[i];
    const anizipTitle = anizipEp?.title?.en || anizipEp?.title?.['x-jat'] || anizipEp?.title?.ja;
    const anizipImage = anizipEp?.image;

    list.push({
      number: i,
      title: anizipTitle || stream?.title || `Episode ${i}`,
      thumbnail: anizipImage || stream?.thumbnail,
    });
  }

  return list;
}
