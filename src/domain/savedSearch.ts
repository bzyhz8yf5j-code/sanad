import { matchesProperty, type PropertyFilters, type PropertySearchRecord } from './searchFilters';

export interface SavedSearchDefinition {
  id: string;
  userId: string;
  enabled: boolean;
  filters: PropertyFilters;
}

export interface SavedSearchMatch {
  searchId: string;
  userId: string;
  propertyId: string;
  dedupeKey: string;
}

export function evaluateSavedSearches(property: PropertySearchRecord, searches: SavedSearchDefinition[]): SavedSearchMatch[] {
  return searches
    .filter((search) => search.enabled && matchesProperty(property, search.filters))
    .map((search) => ({
      searchId: search.id,
      userId: search.userId,
      propertyId: property.id,
      dedupeKey: `saved_search:${search.id}:property:${property.id}`,
    }));
}
