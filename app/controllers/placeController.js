const { Place, Category, Tag } = require("../models");
// const assert = require('assert');
const axios = require("axios");
const { Op } = require("sequelize");
const yelpApiKey = process.env.YELP_API_KEY;
const googleApiKey = process.env.GOOGLE_API_KEY;

class placeController {
  static async getAllPlaces(req, res) {
    try {
      const places = await Place.findAll({
        include: ["place_category"],
        where: {
          user_id: req.auth.payload.sub,
        },
      });
      res.status(200).json({ places });
      // ! mise en forme retour
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getAllCategories(req, res) {
    try {
      const categories = await Category.findAll({
        include: [
          {
            model: Place,
            as: "category_place",
            where: { user_id: req.auth.payload.sub },
            required: false,
          },
        ],
      });

      const formattedData = categories.map((category) => {
        return {
          id: category.id,
          label: category.label,
          label_en: category.label_en,
          label_fr: category.label_fr,
        };
      });

      res.status(200).json(formattedData);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getAllTags(req, res) {
    const { categorylabel } = req.headers;
    try {
      const places = await Tag.findAll({
        include: [
          {
            model: Place,
            include: [
              {
                model: Category,
                as: "place_category",
                where: { label: categorylabel },
              },
            ],
            where: {
              user_id: req.auth.payload.sub,
            },
          },
        ],
      });
      console.dir(`places ${JSON.stringify(places)}`);
      res.status(200).json(places);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getOneCategory(req, res) {
    const { categorylabel } = req.headers;
    try {
      const category = await Category.findOne({
        where: [{ label: categorylabel }],
      });
      res.status(200).json({ category });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getPlacesByCategory(req, res) {
    const { categorylabel } = req.headers;
    try {
      const places = await Place.findAll({
        include: [
          {
            model: Category,
            as: "place_category",
            where: { label: categorylabel },
          },
        ],
        where: {
          user_id: req.auth.payload.sub,
        },
      });

      // data received from db {}[]
      // {"address": "Rue des Acacias, Pont de Viarmes - Nod Hue, 22300 Lannion, France", "category_id": 2, "comment": "commentaire constructif !", "cover": "", "created_at": "2023-03-21T22:10:57.462Z", "favorite": true, "googleid": "ChIJm2gcO-srEkgRr54zI_oRT1A", "id": 2, "latitude": 48.7308695, "longitude": -3.4658228, "name": "Aziza", "place_category": {"created_at": "2023-03-21T20:44:25.116Z", "id": 2, "label": "Restaurant", "label_en": "a Restaurant", "label_fr": "un Restaurant", "updated_at": null}, "rating": 4, "slug": "aziza", "updated_at": "2023-03-21T22:10:57.462Z", "user_id": "auth0|64c2d126f68758196e9d0006", "yelpid": null}

      const formattedData = places.map((place) => {
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
        };
      });

      res.status(200).json(formattedData);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getLatestPlaces(req, res) {
    try {
      const places = await Place.findAll({
        include: ["place_category"],
        where: {
          user_id: req.auth.payload.sub,
        },
        order: [["created_at", "DESC"]],
        limit: 9,
      });
      res.status(200).json({ places });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getLatestPlacesByCategory(req, res) {
    const { categorylabel } = req.headers;
    try {
      const places = await Place.findAll({
        include: [
          {
            model: Category,
            as: "place_category",
            where: { label: categorylabel },
          },
        ],
        where: {
          user_id: req.auth.payload.sub,
        },
        order: [["created_at", "DESC"]],
      });
      res.status(200).json({ places });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getPlaceById(req, res) {
    try {
      const { placeid } = req.headers;
      const place = await Place.findOne({
        include: ["place_note", { model: Tag }, "place_category"],
        where: {
          id: placeid,
          user_id: req.auth.payload.sub,
        },
      });

      if (!place) {
        return res.status(404).json({ message: "Place not found" });
      }

      let placeData = { ...place.dataValues };

      if (placeData.yelpid) {
        try {
          const yelpData = await axios.get(
            `https://api.yelp.com/v3/businesses/${placeData.yelpid}`,
            {
              headers: {
                Authorization: `Bearer ${yelpApiKey}`,
                Accept: "application/json",
              },
            }
          );
          placeData = { ...placeData, yelp: { ...yelpData.data } };
        } catch (err) {
          console.log(`Yelp data not found: ${err}`);
        }
      }

      if (placeData.googleid) {
        const url = "https://maps.googleapis.com/maps/api/place/details/json";
        const params = {
          place_id: placeData.googleid,
          key: googleApiKey,
        };

        try {
          const googleData = await axios.get(url, { params });
          console.log(googleData);
          placeData = { ...placeData, google: { ...googleData.data.result } };
        } catch (err) {
          console.log(`Google data not found: ${err}`);
        }
      }

      if (placeData.google?.photos && placeData.google.photos.length > 0) {
        const url = "https://maps.googleapis.com/maps/api/place/photo";
        const params = {
          key: googleApiKey,
          maxwidth: 400,
          photoreference: placeData.google.photos[0].photo_reference,
        };

        try {
          const googlePhoto = await axios.get(url, { params });
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
    } catch (err) {
      console.log(`Error retrieving place data: ${err}`);
      res.status(500).json({ message: "Internal server error" });
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

  static async placeFromApiById(req, res) {
    const { place_id } = req.headers;
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
      const formattedCategoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
      const categoryInstance = await Category.findOne({
        where: {
          label: formattedCategoryName
        }
      });

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
    } catch (err) {
      console.log(`Google data not found: ${err}`);
    }
  }

  static async placeFromApiByCoords(req, res) {
    try {
      const { lat, lng } = req.headers;
      const yelpData = await axios.get(
        // `https://api.yelp.com/v3/businesses/search?term=${location}&sort_by=best_match&limit=20`,
        `https://api.yelp.com/v3/businesses/search?latitude=${lat}&longitude=${lng}&sort_by=best_match&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${yelpApiKey}`,
            accept: "application/json",
          },
        }
      );
      res.status(200).json(yelpData.data);
    } catch (err) {
      console.log(req.headers);
      console.log(`Yelp data not found: ${err}`);
    }
  }

  static async placeFromApiByName(req, res) {
    try {
      const { location, lat, lng } = req.headers;
      const yelpData = await axios.get(
        // `https://api.yelp.com/v3/businesses/search?term=${location}&sort_by=best_match&limit=20`,
        `https://api.yelp.com/v3/businesses/search?location=${location}&latitude=${lat}&longitude=${lng}&sort_by=distance&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${yelpApiKey}`,
            accept: "application/json",
          },
        }
      );
      res.status(200).json(yelpData.data);
    } catch (err) {
      console.log(req.headers);
      console.log(`Yelp data not found: ${err}`);
    }
  }

  static async getLocationAutoComplete(req, res) {
    const { location, lat, lng, types } = req.headers;
    const url = "https://maps.googleapis.com/maps/api/place/autocomplete/json";
    const params = {
      input: location,
      types: types,
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
            description: prediction.description,
            main_text,
            secondary_text,
            place_id: prediction.place_id,
            types: prediction.types,
            main_text_matched_substrings,
          };
        }
      );
      res.status(200).json(formattedPredictions);
    } catch (error) {
      console.error(`Error fetching Google data: ${error.message}`);
      res
        .status(500)
        .json({ error: "An error occurred while fetching data from Google" });
    }
  }

  static async getLocationExisting(req, res) {
    const { location } = req.headers;
    try {
      const existingPlaces = await Place.findAll({
        where: {
          user_id: req.auth.payload.sub,
          [Op.or]: [
            { address: { [Op.iLike]: `%${location}%` } },
            { name: { [Op.iLike]: `%${location}%` } },
          ],
        },
        include: ["place_note"],
      });
      res.status(200).json({ existingPlaces });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getPlaceDetails(req, res) {
    const { place_id } = req.headers;
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
      console.log(req.headers);
      console.log(`Google data not found: ${error}`);
    }
  }

  static async updatePlace(req, res) {
    try {
      console.log(req.headers);
      const { placeid, favorite } = req.headers;
      const updated = await Place.update(
        { favorite },
        {
          where: {
            id: placeid,
            user_id: req.auth.payload.sub,
          },
        }
      );

      if (updated) {
        const updatedPlace = await Place.findByPk(placeid);
        res.status(200).json({ place: updatedPlace });
      } else {
        res.status(404).json({ message: "Place not found" });
      }
    } catch (error) {
      console.trace(error);
      res.status(500).json({ message: error.message });
    }
  }

  // ! rating doit pouvoir etre 0
  static async createPlace(req, res) {
    try {
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
      } = req.body;

      const place = await Place.create(
        {
          name,
          address,
          comment,
          cover,
          categoryid,
          latitude,
          longitude,
          rating,
          slug,
          favorite,
          googleid,
          user_id: req.auth.payload.sub,
          tags: tags,
        },
        {
          include: {
            model: Tag,
          },
        }
      );

      for (const tag of tags) {
        const [createdTag, _] = await Tag.findOrCreate({
          where: { label: tag.label },
          defaults: { label: tag.label },
        });
        await place.addTag(createdTag);
      }

      // Récupérer les tags associés à la place
      const placeTags = await place.getTags();

      res.status(201).json({ place, tags: placeTags });
    } catch (error) {
      console.trace(error);
      res.status(500).json({ message: error.message });
    }
  }

  static async createPlace2(req, res) {

    const allowed = [
      'name',
      'slug',
      'location',
      'address',
      'latitude',
      'longitude',
      'googleid',
      'yelpid',
      'rating',
      'cover',
      'favorite',
      'comment',
      'category_id',
      'tags',
    ];
    let params = [];
    let setStr = '';

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
        message: err.message
      });
    }
  }

  static async deletePlace(req, res) {
    try {
      const { placeid } = req.headers;
      const deleted = await Place.destroy({
        where: {
          id: placeid,
          user_id: req.auth.payload.sub,
        },
      });
      if (deleted) {
        res.status(200).json({ message: "Place deleted" });
      } else {
        res.status(404).json({ message: "Place not found" });
      }
    } catch (error) {
      console.trace(error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = placeController;
