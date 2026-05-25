# GeoStamp Version History

## Version 20260516-135727-bigdatacloud (Current)

**Release Date:** 2026-05-16 13:57:27

### Changes Summary
- Added BigDataCloud reverse geocoding data source support
- Maintained six-panel layout from previous version

### New Features
1. **BigDataCloud Data Source Integration**
   - Added `reverseGeocodeBigDataCloud()` function for API calls
   - API endpoint: `https://api.bigdatacloud.net/data/reverse-geocode-client`
   - No API key required (free service)
   - Global coverage support
   - Returns administrative division information (country, state/province, city)

2. **Data Source Selector UI**
   - Added dropdown selector in upload panel
   - Two options available:
     - Nominatim (OpenStreetMap) - default
     - BigDataCloud (Global Free)

3. **Separate Caching System**
   - Cache keys include data source identifier
   - Prevents cache conflicts between different sources
   - 7-day cache expiration

### Modified Files
- `index.html` - Added BigDataCloud integration and data source selector

### Technical Details
- New function: `reverseGeocodeBigDataCloud(lat, lng)`
- Modified function: `processQueue()` - now routes to appropriate API based on selected source
- Modified function: `getCacheKey(lat, lng, source)` - includes source parameter
- New state variable: `currentDatasource` - tracks selected data source
- New CSS styles: `.datasource-selector` - for data source dropdown UI

### API Response Handling
BigDataCloud response structure:
```json
{
  "localityInfo": {
    "administrative": [
      { "name": "Country Name" },
      { "name": "State/Province" },
      { "name": "City" }
    ]
  },
  "city": "City Name",
  "locality": "Locality Name",
  "principalSubdivision": "State/Province"
}
```

---

## Version 20260515-six-panel

**Release Date:** 2026-05-15

### Features
- Six-panel grid layout
- Nominatim reverse geocoding
- Multi-language support (EN, ZH, FR, ES, RU, AR)
- EXIF GPS extraction
- File naming options
- Batch processing
- Debug panel

---

## Version 20260515-current

**Release Date:** 2026-05-15

### Features
- Initial versioned backup
- Core geotagging functionality
