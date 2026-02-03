import { Category } from "../models/index.js";
import PlacesService from "../services/places.service.js";
import NotesService from "../services/notes.service.js";
import CategoryService from "../services/category.service.js";
import TagService from "../services/tag.service.js";
import axios from "axios";
const yelpApiKey = process.env.YELP_API_KEY;
const googleApiKey = process.env.GOOGLE_API_KEY;

const parseInclude = (value) => {
  if (value === undefined || value === null) return null;
  const raw = String(value).trim().toLowerCase();
  if (!raw || raw === "none" || raw === "false" || raw === "0") {
    return new Set();
  }
  return new Set(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
};

class placeController {
  static async getAllPlaces(req, res, next) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = "created_at",
        order = "desc",
      } = req.validated || {};
      const { items, count } = await PlacesService.getAllByUserPaginated(
        req.auth.payload.sub,
        { page, limit, sort, order },
      );
      const placeIds = (items || []).map((p) => p.id);
      const counts = await NotesService.countByPlaceIds(
        req.auth.payload.sub,
        placeIds,
      );
      const itemsWithCount = (items || []).map((p) => ({
        ...p,
        notes_count: counts[p.id] || 0,
      }));
      const totalPages = Math.ceil((count || 0) / limit);
      res.status(200).json({
        places: itemsWithCount,
        meta: { page, limit, total: count || 0, totalPages },
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getAllCategories(req, res, next) {
    try {
      const categories = await CategoryService.getAll();

      const formattedData = categories.map((category) => {
        return {
          id: category.id,
          label: category.label,
          label_en: category.label_en,
          label_fr: category.label_fr,
        };
      });

      res.status(200).json({ categories: formattedData });
    } catch (error) {
      return next(error);
    }
  }

  static async getAllTags(req, res, next) {
    const categorylabel = req.params.categorylabel;
    try {
      const tags = await TagService.findByCategoryForUser(
        categorylabel,
        req.auth.payload.sub,
      );
      res.status(200).json({ tags });
    } catch (error) {
      return next(error);
    }
  }

  static async getOneCategory(req, res, next) {
    const categorylabel = req.params.categorylabel;
    try {
      const category = await CategoryService.getOneByLabel(categorylabel);
      res.status(200).json({ category });
    } catch (error) {
      return next(error);
    }
  }

  static async getPlacesByCategory(req, res, next) {
    const categorylabel = req.params.categorylabel;
    try {
      const {
        page = 1,
        limit = 20,
        sort = "created_at",
        order = "desc",
      } = req.validated || {};
      const { items, count } =
        await PlacesService.getAllByCategoryLabelPaginated(
          req.auth.payload.sub,
          categorylabel,
          { page: Number(page) || 1, limit: Number(limit) || 20, sort, order },
        );
      const placeIds = (items || []).map((p) => p.id);
      const counts = await NotesService.countByPlaceIds(
        req.auth.payload.sub,
        placeIds,
      );

      // data received from db {}[]
      // {"address": "Rue des Acacias, Pont de Viarmes - Nod Hue, 22300 Lannion, France", "category_id": 2, "comment": "commentaire constructif !", "cover": "", "created_at": "2023-03-21T22:10:57.462Z", "favorite": true, "googleid": "ChIJm2gcO-srEkgRr54zI_oRT1A", "id": 2, "latitude": 48.7308695, "longitude": -3.4658228, "name": "Aziza", "place_category": {"created_at": "2023-03-21T20:44:25.116Z", "id": 2, "label": "Restaurant", "label_en": "a Restaurant", "label_fr": "un Restaurant", "updated_at": null}, "rating": 4, "slug": "aziza", "updated_at": "2023-03-21T22:10:57.462Z", "user_id": "auth0|64c2d126f68758196e9d0006", "yelpid": null}

      const formattedData = (items || []).map((place) => {
        return {
          address: place.address,
          category_id: place.category_id,
          comment: place.comment,
          cover: place.cover,
          id: place.id,
          latitude: place.latitude,
          longitude: place.longitude,
          name: place.name,
          rating: place.rating,
          slug: place.slug,
          favorite: place.favorite,
          googleid: place.googleid,
          yelpid: place.yelpid,
          notes_count: counts[place.id] || 0,
        };
      });

      const totalPages = Math.ceil((count || 0) / (Number(limit) || 20));
      res.status(200).json({
        places: formattedData,
        meta: {
          page: Number(page) || 1,
          limit: Number(limit) || 20,
          total: count || 0,
          totalPages,
        },
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getLatestPlaces(req, res, next) {
    try {
      const limit = Number(req?.validated?.limit ?? req?.query?.limit ?? 9);
      const places = await PlacesService.getLatestByUser(
        req.auth.payload.sub,
        limit,
      );
      res.status(200).json({ places });
    } catch (error) {
      return next(error);
    }
  }

  static async getLatestPlacesByCategory(req, res, next) {
    const categorylabel = req.params.categorylabel;
    try {
      const limit = Number(req?.validated?.limit ?? req?.query?.limit ?? 9);
      const places = await PlacesService.getLatestByCategoryLabel(
        req.auth.payload.sub,
        categorylabel,
        limit,
      );
      res.status(200).json({ places });
    } catch (error) {
      return next(error);
    }
  }

  static async getPlaceById(req, res, next) {
    try {
      const placeId = req.params.id;
      const place = await PlacesService.getPlaceById(
        req.auth.payload.sub,
        placeId,
      );

      if (!place) {
        return res.status(404).json({ message: "Place not found" });
      }

      let placeData = { ...place };

      const timeoutMs = Number(process.env.HTTP_CLIENT_TIMEOUT_MS || 5000);
      const include = parseInclude(req.query?.include);
      const shouldIncludeYelp = include ? include.has("yelp") : true;
      const shouldIncludeGoogle = include ? include.has("google") : true;

      if (placeData.yelpid && shouldIncludeYelp) {
        try {
          const yelpData = await axios.get(
            `https://api.yelp.com/v3/businesses/${placeData.yelpid}`,
            {
              headers: {
                Authorization: `Bearer ${yelpApiKey}`,
                Accept: "application/json",
              },
              timeout: timeoutMs,
            },
          );
          placeData = { ...placeData, yelp: { ...yelpData.data } };
        } catch (err) {
          if (process.env.NODE_ENV !== "production")
            console.log(`Yelp data not found: ${err}`);
        }
      }

      if (placeData.googleid && shouldIncludeGoogle) {
        const url = "https://maps.googleapis.com/maps/api/place/details/json";
        const params = {
          place_id: placeData.googleid,
          key: googleApiKey,
        };

        try {
          const googleData = await axios.get(url, {
            params,
            timeout: timeoutMs,
          });
          placeData = { ...placeData, google: { ...googleData.data.result } };
        } catch (err) {
          console.log(`Google data not found: ${err}`);
        }
      }

      if (
        shouldIncludeGoogle &&
        placeData.google?.photos &&
        placeData.google.photos.length > 0
      ) {
        const url = "https://maps.googleapis.com/maps/api/place/photo";
        const params = {
          key: googleApiKey,
          maxwidth: 400,
          photoreference: placeData.google.photos[0].photo_reference,
        };

        try {
          const googlePhoto = await axios.get(url, {
            params,
            timeout: timeoutMs,
          });
          // console.log(googlePhoto.request.res.responseUrl);
          placeData = {
            ...placeData,
            google: {
              ...placeData.google,
              google_cover: googlePhoto.request.res.responseUrl,
            },
          };
        } catch (err) {
          console.log(`Google photo not found: ${err}`);
        }
      }
      //console.log(placeData);
      res.status(200).json(placeData);
    } catch (error) {
      return next(error);
    }
  }

  // "google": {
  // 	"address_components": [
  // 		{
  // 			"long_name": "Lannion",
  // 			"short_name": "Lannion",
  // 			"types": [
  // 				"locality",
  // 				"political"
  // 			]
  // 		},
  // 		{
  // 			"long_name": "Côtes-d'Armor",
  // 			"short_name": "Côtes-d'Armor",
  // 			"types": [
  // 				"administrative_area_level_2",
  // 				"political"
  // 			]
  // 		},
  // 		{
  // 			"long_name": "Bretagne",
  // 			"short_name": "Bretagne",
  // 			"types": [
  // 				"administrative_area_level_1",
  // 				"political"
  // 			]
  // 		},
  // 		{
  // 			"long_name": "France",
  // 			"short_name": "FR",
  // 			"types": [
  // 				"country",
  // 				"political"
  // 			]
  // 		},
  // 		{
  // 			"long_name": "22300",
  // 			"short_name": "22300",
  // 			"types": [
  // 				"postal_code"
  // 			]
  // 		}
  // 	],
  // 	"adr_address": "Rue des Acacias, <span class=\"street-address\">Pont de Viarmes - Nod Hue</span>, <span class=\"postal-code\">22300</span> <span class=\"locality\">Lannion</span>, <span class=\"country-name\">France</span>",
  // 	"business_status": "OPERATIONAL",
  // 	"current_opening_hours": {
  // 		"open_now": false,
  // 		"periods": [
  // 			{
  // 				"close": {
  // 					"date": "2023-08-13",
  // 					"day": 0,
  // 					"time": "1400"
  // 				},
  // 				"open": {
  // 					"date": "2023-08-13",
  // 					"day": 0,
  // 					"time": "1200"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"date": "2023-08-13",
  // 					"day": 0,
  // 					"time": "2200"
  // 				},
  // 				"open": {
  // 					"date": "2023-08-13",
  // 					"day": 0,
  // 					"time": "1900"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"date": "2023-08-09",
  // 					"day": 3,
  // 					"time": "1400"
  // 				},
  // 				"open": {
  // 					"date": "2023-08-09",
  // 					"day": 3,
  // 					"time": "1200"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"date": "2023-08-09",
  // 					"day": 3,
  // 					"time": "2200"
  // 				},
  // 				"open": {
  // 					"date": "2023-08-09",
  // 					"day": 3,
  // 					"time": "1900"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"date": "2023-08-10",
  // 					"day": 4,
  // 					"time": "1400"
  // 				},
  // 				"open": {
  // 					"date": "2023-08-10",
  // 					"day": 4,
  // 					"time": "1200"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"date": "2023-08-10",
  // 					"day": 4,
  // 					"time": "2200"
  // 				},
  // 				"open": {
  // 					"date": "2023-08-10",
  // 					"day": 4,
  // 					"time": "1900"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"date": "2023-08-11",
  // 					"day": 5,
  // 					"time": "1400"
  // 				},
  // 				"open": {
  // 					"date": "2023-08-11",
  // 					"day": 5,
  // 					"time": "1200"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"date": "2023-08-11",
  // 					"day": 5,
  // 					"time": "2200"
  // 				},
  // 				"open": {
  // 					"date": "2023-08-11",
  // 					"day": 5,
  // 					"time": "1900"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"date": "2023-08-12",
  // 					"day": 6,
  // 					"time": "1400"
  // 				},
  // 				"open": {
  // 					"date": "2023-08-12",
  // 					"day": 6,
  // 					"time": "1200"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"date": "2023-08-12",
  // 					"day": 6,
  // 					"time": "2200"
  // 				},
  // 				"open": {
  // 					"date": "2023-08-12",
  // 					"day": 6,
  // 					"time": "1900"
  // 				}
  // 			}
  // 		],
  // 		"weekday_text": [
  // 			"Monday: Closed",
  // 			"Tuesday: Closed",
  // 			"Wednesday: 12:00 – 2:00 PM, 7:00 – 10:00 PM",
  // 			"Thursday: 12:00 – 2:00 PM, 7:00 – 10:00 PM",
  // 			"Friday: 12:00 – 2:00 PM, 7:00 – 10:00 PM",
  // 			"Saturday: 12:00 – 2:00 PM, 7:00 – 10:00 PM",
  // 			"Sunday: 12:00 – 2:00 PM, 7:00 – 10:00 PM"
  // 		]
  // 	},
  // 	"delivery": false,
  // 	"dine_in": true,
  // 	"formatted_address": "Rue des Acacias, Pont de Viarmes - Nod Hue, 22300 Lannion, France",
  // 	"formatted_phone_number": "02 96 37 60 53",
  // 	"geometry": {
  // 		"location": {
  // 			"lat": 48.7308695,
  // 			"lng": -3.4658228
  // 		},
  // 		"viewport": {
  // 			"northeast": {
  // 				"lat": 48.7321767802915,
  // 				"lng": -3.464391219708498
  // 			},
  // 			"southwest": {
  // 				"lat": 48.7294788197085,
  // 				"lng": -3.467089180291502
  // 			}
  // 		}
  // 	},
  // 	"icon": "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/restaurant-71.png",
  // 	"icon_background_color": "#FF9E67",
  // 	"icon_mask_base_uri": "https://maps.gstatic.com/mapfiles/place_api/icons/v2/restaurant_pinlet",
  // 	"international_phone_number": "+33 2 96 37 60 53",
  // 	"name": "Aziza",
  // 	"opening_hours": {
  // 		"open_now": false,
  // 		"periods": [
  // 			{
  // 				"close": {
  // 					"day": 0,
  // 					"time": "1400"
  // 				},
  // 				"open": {
  // 					"day": 0,
  // 					"time": "1200"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"day": 0,
  // 					"time": "2200"
  // 				},
  // 				"open": {
  // 					"day": 0,
  // 					"time": "1900"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"day": 3,
  // 					"time": "1400"
  // 				},
  // 				"open": {
  // 					"day": 3,
  // 					"time": "1200"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"day": 3,
  // 					"time": "2200"
  // 				},
  // 				"open": {
  // 					"day": 3,
  // 					"time": "1900"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"day": 4,
  // 					"time": "1400"
  // 				},
  // 				"open": {
  // 					"day": 4,
  // 					"time": "1200"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"day": 4,
  // 					"time": "2200"
  // 				},
  // 				"open": {
  // 					"day": 4,
  // 					"time": "1900"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"day": 5,
  // 					"time": "1400"
  // 				},
  // 				"open": {
  // 					"day": 5,
  // 					"time": "1200"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"day": 5,
  // 					"time": "2200"
  // 				},
  // 				"open": {
  // 					"day": 5,
  // 					"time": "1900"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"day": 6,
  // 					"time": "1400"
  // 				},
  // 				"open": {
  // 					"day": 6,
  // 					"time": "1200"
  // 				}
  // 			},
  // 			{
  // 				"close": {
  // 					"day": 6,
  // 					"time": "2200"
  // 				},
  // 				"open": {
  // 					"day": 6,
  // 					"time": "1900"
  // 				}
  // 			}
  // 		],
  // 		"weekday_text": [
  // 			"Monday: Closed",
  // 			"Tuesday: Closed",
  // 			"Wednesday: 12:00 – 2:00 PM, 7:00 – 10:00 PM",
  // 			"Thursday: 12:00 – 2:00 PM, 7:00 – 10:00 PM",
  // 			"Friday: 12:00 – 2:00 PM, 7:00 – 10:00 PM",
  // 			"Saturday: 12:00 – 2:00 PM, 7:00 – 10:00 PM",
  // 			"Sunday: 12:00 – 2:00 PM, 7:00 – 10:00 PM"
  // 		]
  // 	},
  // 	"place_id": "ChIJm2gcO-srEkgRr54zI_oRT1A",
  // 	"plus_code": {
  // 		"compound_code": "PGJM+8M Lannion, France",
  // 		"global_code": "8CWRPGJM+8M"
  // 	},
  // 	"price_level": 2,
  // 	"rating": 4.5,
  // 	"reference": "ChIJm2gcO-srEkgRr54zI_oRT1A",
  // 	"reservable": true,
  // 	"serves_beer": true,
  // 	"serves_breakfast": false,
  // 	"serves_dinner": true,
  // 	"serves_lunch": true,
  // 	"serves_vegetarian_food": true,
  // 	"serves_wine": true,
  // 	"takeout": true,
  // 	"types": [
  // 		"restaurant",
  // 		"food",
  // 		"point_of_interest",
  // 		"establishment"
  // 	],
  // 	"url": "https://maps.google.com/?cid=5786863812224458415",
  // 	"user_ratings_total": 924,
  // 	"utc_offset": 120,
  // 	"vicinity": "Rue des Acacias, Pont de Viarmes - Nod Hue, Lannion",
  // 	"website": "http://aziza.fr/",
  // 	"wheelchair_accessible_entrance": true,
  // 	"google_cover": "https://lh3.googleusercontent.com/places/ANJU3DtL0nCIIl4a9RqrBT2GpDIVEwSYFSQUEb_EylxmAp033xRGHx-iwyzaMzUWKxK2IXnhNtDD68wl_mpA9OF_arlgT1KeijG4Thc=s1600-w400"
  // }

  static async placeFromApiById(req, res, next) {
    const place_id = req.query.place_id;
    const url = "https://maps.googleapis.com/maps/api/place/details/json";
    const params = {
      place_id: place_id,
      key: googleApiKey,
      language: "fr",
    };

    try {
      const googleData = await axios.get(url, { params });
      console.log(googleData.data.result);
      // placeData = { ...placeData, google:{...googleData.data.result} };

      const categoryName = googleData.data.result.types[0];
      const formattedCategoryName =
        categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
      const categoryInstance = await Category.findOneByLabel(
        formattedCategoryName,
      );

      const formattedData = {
        name: googleData.data.result.name,
        current_opening_hours: googleData.data.result.opening_hours,
        formatted_address: googleData.data.result.formatted_address,
        formatted_phone_number: googleData.data.result.formatted_phone_number,
        geometry: googleData.data.result.geometry,
        place_id: googleData.data.result.place_id,
        price_level: googleData.data.result.price_level,
        rating: googleData.data.result.rating,
        types: googleData.data.result.types,
        category_id: categoryInstance.id,
        user_ratings_total: googleData.data.result.user_ratings_total,
        website: googleData.data.result.website,
        google_cover: googleData.data.result.google_cover,
      };

      res.status(200).json(formattedData);
    } catch (error) {
      return next(error);
    }
  }

  static async placeFromApiByCoords(req, res, next) {
    try {
      const { lat, lng } = req.query;
      const yelpData = await axios.get(
        // `https://api.yelp.com/v3/businesses/search?term=${location}&sort_by=best_match&limit=20`,
        `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lng}&sort_by=best_match&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${yelpApiKey}`,
            accept: "application/json",
          },
        },
      );
      res.status(200).json(yelpData.data);
    } catch (error) {
      return next(error);
    }
  }

  static async placeFromApiByName(req, res, next) {
    try {
      const { location, lat, lng } = req.query;
      const yelpData = await axios.get(
        // `https://api.yelp.com/v3/businesses/search?term=${location}&sort_by=best_match&limit=20`,
        `https://api.yelp.com/v3/businesses/search?location=${location}&latitude=${lat}&longitude=${lng}&sort_by=distance&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${yelpApiKey}`,
            accept: "application/json",
          },
        },
      );
      res.status(200).json(yelpData.data);
    } catch (error) {
      return next(error);
    }
  }

  static async getLocationAutoComplete(req, res, next) {
    const { location, lat, lng, types } = req.query;
    const url = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
    const params = {
      input: location,
      types: types,
      fields: ["structured_formatting", "place_id"],
      language: "fr",
      location: `${lat},${lng}`,
      radius: 5000,
      key: googleApiKey,
    };

    try {
      const response = await axios.get(url, { params });

      //console.log(response.data.predictions[0])
      // {
      //   "description": "Ozgûr Kebab, Avenue Ernest Renan, Lannion, France",
      //   "matched_substrings": [
      //     {
      //       "length": 5,
      //       "offset": 6
      //     }
      //   ],
      //   "place_id": "ChIJlyEiq-4rEkgRMBq8tjcMrYo",
      //   "reference": "ChIJlyEiq-4rEkgRMBq8tjcMrYo",
      //   "structured_formatting": {
      //     "main_text": "Ozgûr Kebab",
      //     "main_text_matched_substrings": [
      //       {
      //         "length": 5,
      //         "offset": 6
      //       }
      //     ],
      //     "secondary_text": "Avenue Ernest Renan, Lannion, France"
      //   },
      //   "terms": [
      //     {
      //       "offset": 0,
      //       "value": "Ozgûr Kebab"
      //     },
      //     {
      //       "offset": 13,
      //       "value": "Avenue Ernest Renan"
      //     },
      //     {
      //       "offset": 34,
      //       "value": "Lannion"
      //     },
      //     {
      //       "offset": 43,
      //       "value": "France"
      //     }
      //   ],
      //   "types": [
      //     "restaurant",
      //     "food",
      //     "point_of_interest",
      //     "establishment"
      //   ]
      // }

      const formattedPredictions = response.data.predictions.map(
        (prediction) => {
          const { main_text, secondary_text, main_text_matched_substrings } =
            prediction.structured_formatting;
          return {
            // description: prediction.description,
            main_text,
            secondary_text,
            place_id: prediction.place_id,
            // types: prediction.types,
            main_text_matched_substrings,
          };
        },
      );
      res.status(200).json(formattedPredictions);
    } catch (error) {
      return next(error);
    }
  }

  // static async getLocationAutoComplete(req, res) {
  //   const {
  //     location,
  //     lat,
  //     lng,
  //     types
  //   } = req.headers;
  //   const url = "https://api.yelp.com/v3/businesses/search";
  //   const params = {
  //     text: location,
  //     locale: "fr_FR",
  //     // types: types,
  //     latitude: lat,
  //     longitude: lng,
  //     radius: 5000,
  //     Authorization: `Bearer ${yelpApiKey}`,
  //   };

  //   try {
  //     const response = await axios.get(url, {
  //       params
  //     });

  //     //console.log(response.data.predictions[0])
  //     // {
  //     //   "description": "Ozgûr Kebab, Avenue Ernest Renan, Lannion, France",
  //     //   "matched_substrings": [
  //     //     {
  //     //       "length": 5,
  //     //       "offset": 6
  //     //     }
  //     //   ],
  //     //   "place_id": "ChIJlyEiq-4rEkgRMBq8tjcMrYo",
  //     //   "reference": "ChIJlyEiq-4rEkgRMBq8tjcMrYo",
  //     //   "structured_formatting": {
  //     //     "main_text": "Ozgûr Kebab",
  //     //     "main_text_matched_substrings": [
  //     //       {
  //     //         "length": 5,
  //     //         "offset": 6
  //     //       }
  //     //     ],
  //     //     "secondary_text": "Avenue Ernest Renan, Lannion, France"
  //     //   },
  //     //   "terms": [
  //     //     {
  //     //       "offset": 0,
  //     //       "value": "Ozgûr Kebab"
  //     //     },
  //     //     {
  //     //       "offset": 13,
  //     //       "value": "Avenue Ernest Renan"
  //     //     },
  //     //     {
  //     //       "offset": 34,
  //     //       "value": "Lannion"
  //     //     },
  //     //     {
  //     //       "offset": 43,
  //     //       "value": "France"
  //     //     }
  //     //   ],
  //     //   "types": [
  //     //     "restaurant",
  //     //     "food",
  //     //     "point_of_interest",
  //     //     "establishment"
  //     //   ]
  //     // }

  //     const formattedPredictions = response.data.predictions.map(
  //       (prediction) => {
  //         const {
  //           main_text,
  //           secondary_text,
  //           main_text_matched_substrings
  //         } =
  //         prediction.structured_formatting;
  //         return {
  //           description: prediction.description,
  //           main_text,
  //           secondary_text,
  //           place_id: prediction.place_id,
  //           types: prediction.types,
  //           main_text_matched_substrings,
  //         };
  //       }
  //     );
  //     res.status(200).json(formattedPredictions);
  //   } catch (error) {
  //     console.error(`Error fetching Google data: ${error.message}`);
  //     res
  //       .status(500)
  //       .json({
  //         error: "An error occurred while fetching data from Google"
  //       });
  //   }
  // }

  static async getLocationExisting(req, res, next) {
    const { location } = req.query;
    try {
      const existingPlaces = await PlacesService.findExisting(
        req.auth.payload.sub,
        location,
      );
      res.status(200).json({ existingPlaces });
    } catch (error) {
      return next(error);
    }
  }

  static async getPlaceDetails(req, res, next) {
    const { place_id } = req.query;
    const url = "https://maps.googleapis.com/maps/api/place/details/json";
    const params = {
      place_id: place_id,
      key: googleApiKey,
    };

    try {
      const response = await axios.get(url, { params });
      // console.log(response.data.result);
      res.status(200).json(response.data.result);
    } catch (error) {
      return next(error);
    }
  }

  static async updatePlace(req, res, next) {
    try {
      const { favorite } = req.validated || req.body || {};
      const placeId = req.params.id;
      const updatedPlace = await PlacesService.updateFavorite(
        req.auth.payload.sub,
        placeId,
        favorite === "true" || favorite === true,
      );
      if (updatedPlace) {
        res.status(200).json({ place: updatedPlace });
      } else {
        res.status(404).json({ message: "Place not found" });
      }
    } catch (error) {
      return next(error);
    }
  }

  // ! rating doit pouvoir etre 0
  static async createPlace(req, res, next) {
    try {
      const source = req.validated || req.body || {};
      const {
        name,
        address,
        comment,
        cover,
        category_id,
        latitude,
        longitude,
        rating,
        slug,
        favorite,
        googleid,
        tags,
      } = source;
      const { place, tags: placeTags } = await PlacesService.createPlace(
        req.auth.payload.sub,
        {
          name,
          address,
          comment,
          cover,
          category_id,
          latitude,
          longitude,
          rating,
          slug,
          favorite,
          googleid,
          tags,
        },
      );

      res.status(201).json({ place, tags: placeTags });
    } catch (error) {
      return next(error);
    }
  }

  static async createPlace2(req, res) {
    const allowed = [
      "name",
      "slug",
      "location",
      "address",
      "latitude",
      "longitude",
      "googleid",
      "yelpid",
      "rating",
      "cover",
      "favorite",
      "comment",
      "category_id",
      "tags",
    ];
    let params = [];
    let setStr = "";

    for (var key in req.body) {
      if (allowed.some((allowedKey) => allowedKey === key)) {
        setStr += `${key} = '${req.body[key]}',`;
        params.push[key];
      }
    }

    try {
      const result = await client.query(query, values);
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: err.message,
      });
    }
  }

  static async deletePlace(req, res, next) {
    try {
      const id = req.params.id;
      const deleted = await PlacesService.deletePlace(req.auth.payload.sub, id);
      if (deleted) {
        res.status(200).json({ message: "Place deleted" });
      } else {
        res.status(404).json({ message: "Place not found" });
      }
    } catch (error) {
      return next(error);
    }
  }
}

export default placeController;
