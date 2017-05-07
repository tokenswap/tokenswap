import { Meteor } from 'meteor/meteor';

// Products data. Initiate on startup.
if (Products.find().count() === 0) {
console.log('Loading Products data.');
  let products = [
      {
        name: 'Gadgets',
        image: '/images/gadgets.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      },
      {
        name: 'Computers',
        image: '/images/computers.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      },
      {
        name: 'Fashion & Clothing',
        image: '/images/clothing.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      },
      {
        name: 'Accessories',
        image: '/images/accessories.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      },
      {
        name: 'Toys & Hobbies',
        image: '/images/toys.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      },
      {
        name: 'Home & Furniture',
        image: '/images/home.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      },
      {
        name: 'Food Products',
        image: '/images/food.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      },
      {
        name: 'Health & Beauty',
        image: '/images/beauty.jpg',
        listingsCount: 0,
        productOffersCount: 0,
        productSoldCount: 0
      }
  ];
  products.forEach(function(product){
    Products.insert(product);
  });
}
