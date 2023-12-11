const Property = require("../models/Property");
const { validateBody } = require("../utils/utilityFunctions");
const { cloudinary } = require("../utils/cloudinary");
const Notification = require("../models/Notification");

const express = require('express');
const NodeCache = require('node-cache');

const app = express();
const myCache = new NodeCache();


// Import the Property model (assuming you have a "Property" model defined).

// Define a controller function for creating a property
const createProperty = async (req, res) => {
  // Validate the incoming request using Express Validator
  if (validateBody(req, res)) {
    return;
  }

  // Extract data from the request
  const { apartment, amount, images, location, about, features, mainFeatures } = req.body;

  // Save images to Cloudinary and get their links
  const imageUrls = [];
 // Assuming "images" is a field in your form for file uploads

  if (images && images.length > 0) {
    for (const image of images) {
      const cloudinaryResponse = await cloudinary.uploader.upload(image, (err, result)=>{
        if (err) {
          return res.status(500).json({ message: "Image upload failed" , err});
        }
      });
      imageUrls.push(cloudinaryResponse.secure_url);
    }
  }

  // Create a new Property instance
  const newProperty = new Property({
    apartment,
    images: imageUrls, // Store Cloudinary image links
    amount,
    location,
    about,
    features,
    mainFeatures,
    owner : req.user.user_id
  });
scr
  // Create a new Date object to get the current date and time
const currentDate = new Date();

// Get the year, month, and day
const year = currentDate.getFullYear();
const month = currentDate.getMonth() + 1; // Months are zero-based, so add 1
const day = currentDate.getDate();

// Create formatted strings for the date
const formattedDate = `${day}-${month < 10 ? '0' : ''}${month}-${year}`;


  //Notification Content
  const notificationContent = {
    heading : "Property Created Sucesss",
    content : `A new ${apartment} was added to your  apartment list  on  ${formattedDate}`,
    user_id : req.user.user_id,
    attachment : newProperty._id,
    Date : formattedDate
    
  }

  // Save the property to the database
  try {
    await newProperty.save();
    const newNotification = await Notification.create(notificationContent)
    return res.status(201).json({ message: "Property created successfully", property: newProperty });
  } catch (error) {
    return res.status(500).json({ message: "Error creating the property",  error : error.message });
  }
};



const showMyProperty = async (req, res)=> {

    const user = req.user 

    try {
        const  properties = await Property.find({ owner: user.user_id })
        if(!properties){
            return res.status(404).json({message:"property  not found"})
        }
        res.status(200).json( properties )
    } catch (error) {
        return res.status(500).json({ message: "Error fetching property",  error : error.message });
    }
}

const showProperty = async (req, res) => {
  const user = req.user;

  try {
      const query = {};
      // Check for query parameters and build the query object accordingly
      if (req.query.apartment) {
          query.apartment = { $regex: new RegExp(req.query.apartment, 'i') };
      }
      if (req.query.location) {
          query.location = { $regex: new RegExp(req.query.location, 'i') };
      }
      if (req.query.minAmount) {
          query.amount = { $gte: parseFloat(req.query.minAmount) };
      }
      if (req.query.maxAmount) {
          if (!query.amount) query.amount = {};
          query.amount.$lte = parseFloat(req.query.maxAmount);
      }

      const properties = await Property.find(query);

      if (properties.length === 0) {
          return res.status(404).json({ message: "Properties not found" });
      }

      res.status(200).json(properties);
  } catch (error) {
      return res.status(500).json({ message: "Error fetching properties", error: error.message });
  }
};



// const showAllProperties = async (req, res) => {
//   try {
//       const query = {};

//       // Check if 'search' parameter is provided in the query
//       if (req.query.search) {
//           const searchRegex = { $regex: new RegExp(req.query.search, 'i') };
//           query.$or = [
//               { apartment: searchRegex },
//               { location: searchRegex },
//           ];
//       }

//       const properties = await Property.find(query);

//       if (properties.length === 0) {
//           return res.status(404).json({ message: "Properties not found" });
//       }

//       res.status(200).json(properties);
//   } catch (error) {
//       return res.status(500).json({ message: "Error fetching properties", error: error.message });
//   }
// };


const showAllProperties = async (req, res) => {
  try {
    const query = {};

    // Check if 'search' parameter is provided in the query
    if (req.query.search) {
      const searchRegex = { $regex: new RegExp(req.query.search, 'i') };
      query.$or = [
        { apartment: searchRegex },
        { location: searchRegex },
      ];
    }

    // Check if the result is already in the cache
    const cacheKey = JSON.stringify(req.query.search);
    const cachedProperties = myCache.get(cacheKey);

    if (cachedProperties) {
      // If data is found in cache, send it directly
      return res.status(200).json(cachedProperties);
    }

    // If data is not found in cache, fetch from the database
    const properties = await Property.find(query);

    if (properties.length === 0) {
      return res.status(404).json({ message: "Properties not found" });
    }

    // Store the result in the cache
    myCache.set(cacheKey, properties, 180); // Adjust the cache time as needed

    res.status(200).json(properties);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching properties", error: error.message });
  }
};




// temporary  location route

// const showpropLocation = async (req, res) => {
//   try {
//     const query = {};

//     // Check if 'search' parameter is provided in the query
//     if (req.query.search) {
//       const searchRegex = { $regex: new RegExp(req.query.search, 'i') };
//       query.$or = [
//         { apartment: searchRegex },
//         { location: searchRegex },
//       ];
//     }

//     // Check if the result is already in the cache
//     const cacheKey = JSON.stringify(req.query.search);
//     const cachedProperties = myCache.get(cacheKey);

//     if (cachedProperties) {
//       // If data is found in cache, send it directly
//       return res.status(200).json(cachedProperties);
//     }

//     // If data is not found in cache, fetch from the database
//     const properties = await Property.find(query);

//     if (properties.length === 0) {
//       return res.status(404).json({ message: "Properties not found" });
//     }

//     // Store the result in the cache
//     myCache.set(cacheKey, properties, 60); // Adjust the cache time as needed

//     res.status(200).json(properties);
//   } catch (error) {
//     return res.status(500).json({ message: "Error fetching properties", error: error.message });
//   }
// };




const showSingleProperty = async (req, res)=> {
  const propertyId = req.params.id  
  try {
      const  properties = await Property.findById(propertyId)
      if(!properties){
          return res.status(404).json({message:"property  not found"})
      }

      res.status(200).json( properties )
  } catch (error) {
      return res.status(500).json({ message: "Error fetching property",  error : error.message });
  }
}


const deleteProperty = async (req, res) => {
  const   propertyId = req.params.id;
  try {
       const deletedProperty = await  Property.findByIdAndDelete(propertyId)
       if(!deletedProperty) {
        return   res.status(404).json({message :"Property not found"})
       }
       res.status(200).json({message : "Property deleted successfully"})
  } catch (error) {
     return res.status(500).json({ message: "Fail to delete",  error : error.message });
  }
}

const getPropertyByQuery = async (req, res) => {
  try {
    const { houseType, priceRange } = req.body;

    // Construct the query based on the request body
    const query = {
      apartment: houseType,
      amount: {
        $gte: parseInt(priceRange.minPrice),
        $lte: parseInt(priceRange.maxPrice),
      },
    };

    // Perform the database query
    const properties = await Property.find(query);

    // Return the results
    res.status(200).json({ properties });
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


const updateProperty = async (req, res) => {
  if (validateBody(req, res)) {
    return;
  }

  // Extract property ID from the request parameters
  const propertyId = req.params.id;

  // Extract data from the request
  const { apartment, amount, images, location, about, features, mainFeatures } = req.body;

  // Save images to Cloudinary and get their links
  const imageUrls = [];

  if (images && images.length > 0) {
    for (const image of images) {
      const cloudinaryResponse = await cloudinary.uploader.upload(image, (err, result) => {
        if (err) {
          return res.status(500).json({ message: "Image upload failed", err });
        }
      });
      imageUrls.push(cloudinaryResponse.secure_url);
    }
  }

  // Update the existing Property instance
  try {
    const existingProperty = await Property.findById(propertyId);

    if (!existingProperty) {
      return res.status(404).json({ message: "Property not found" });
    }

    existingProperty.apartment = apartment;
    existingProperty.images = imageUrls;
    existingProperty.amount = amount;
    existingProperty.location = location;
    existingProperty.about = about;
    existingProperty.features = features;
    existingProperty.mainFeatures = mainFeatures;



    // Save the updated property to the database
    await existingProperty.save();

    return res.status(200).json({ message: "Property updated successfully", property: existingProperty });
  } catch (error) {
    return res.status(500).json({ error: "Error updating the property", message: error.message });
  }
};




module.exports = {getPropertyByQuery, createProperty ,showMyProperty , updateProperty , showAllProperties, showSingleProperty , deleteProperty};