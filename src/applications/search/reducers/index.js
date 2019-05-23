import {
  FETCH_SEARCH_RESULTS,
  FETCH_SEARCH_RESULTS_SUCCESS,
  FETCH_SEARCH_RESULTS_FAILURE,
} from '../actions';

const initialState = {
  searchesPerformed: 0,
  results: [],
  loading: false,
  error: null,
};

function SearchReducer(state = initialState, action) {
  switch (action.type) {
    case FETCH_SEARCH_RESULTS: {
      return {
        ...state,
        loading: true,
        results: undefined,
        recommendedResults: undefined,
      };
    }

    case FETCH_SEARCH_RESULTS_SUCCESS: {
      const { query } = action.results;
      const {
        currentPage,
        perPage,
        totalPages,
        totalEntries,
      } = action.meta.pagination;
      const { results } = action.results.web;
      const recommendedResults = action.results.textBestBets;
      const searchesPerformed = state.searchesPerformed + 1;

      return {
        ...state,
        query,
        recommendedResults,
        results,
        totalEntries,
        currentPage,
        perPage,
        totalPages,
        searchesPerformed,
        hasError: false,
        loading: false,
      };
    }

    case FETCH_SEARCH_RESULTS_FAILURE: {
      return {
        ...state,
        recommendedResults: undefined,
        hasError: true,
        results: undefined,
        loading: false,
      };
    }

    default:
      return state;
  }
}

export default {
  search: SearchReducer,
};
