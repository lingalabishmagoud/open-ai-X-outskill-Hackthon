const sdk = require('node-appwrite');

const client = new sdk.Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6a15e01e003b014edc62')
  .setKey('standard_8dd00cf9c7ed0486896bbe5cfd829564d5754228084ef851fe88823b459b4190da513dc160f216ce49eb7edd5eb7ed099a12decc6092e7ec267ae427470b3d3e93fee5073c06efc904aa21e73c393a6d3cb48c60d997730b4614817bd74210a7a809b9bf5f5bd0cc9652f6275417d666e923bb42ae312066ba6e4e51621902d3');

const databases = new sdk.Databases(client);
const DB_ID = 'main_store';
const COL_ID = 'products';

const products = [
  // ── GROCERIES & STAPLES ──
  { name: "Aashirvaad Atta 5kg", category: "Groceries", mrp: 285, wholesale_price: 240, image_url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300" },
  { name: "Fortune Sunflower Oil 1L", category: "Groceries", mrp: 145, wholesale_price: 120, image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300" },
  { name: "Tata Salt 1kg", category: "Groceries", mrp: 24, wholesale_price: 18, image_url: "https://images.unsplash.com/photo-1519974719765-e6559eac2575?w=300" },
  { name: "India Gate Basmati Rice 5kg", category: "Groceries", mrp: 480, wholesale_price: 400, image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300" },
  { name: "Toor Dal 1kg", category: "Groceries", mrp: 165, wholesale_price: 140, image_url: "https://images.unsplash.com/photo-1585952693890-f4e67a1de3a2?w=300" },
  { name: "Moong Dal 500g", category: "Groceries", mrp: 80, wholesale_price: 65, image_url: "https://images.unsplash.com/photo-1585952693890-f4e67a1de3a2?w=300" },
  { name: "Chana Dal 1kg", category: "Groceries", mrp: 110, wholesale_price: 90, image_url: "https://images.unsplash.com/photo-1585952693890-f4e67a1de3a2?w=300" },
  { name: "Urad Dal 500g", category: "Groceries", mrp: 75, wholesale_price: 60, image_url: "https://images.unsplash.com/photo-1585952693890-f4e67a1de3a2?w=300" },
  { name: "MDH Turmeric Powder 100g", category: "Groceries", mrp: 55, wholesale_price: 42, image_url: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300" },
  { name: "MDH Red Chilli Powder 100g", category: "Groceries", mrp: 60, wholesale_price: 48, image_url: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300" },
  { name: "MDH Coriander Powder 100g", category: "Groceries", mrp: 45, wholesale_price: 36, image_url: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300" },
  { name: "Everest Garam Masala 50g", category: "Groceries", mrp: 55, wholesale_price: 42, image_url: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300" },
  { name: "Sugar 1kg", category: "Groceries", mrp: 48, wholesale_price: 40, image_url: "https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=300" },
  { name: "Tea Powder 250g", category: "Groceries", mrp: 95, wholesale_price: 78, image_url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300" },
  { name: "Bru Coffee 50g", category: "Groceries", mrp: 85, wholesale_price: 70, image_url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300" },
  { name: "Poha 500g", category: "Groceries", mrp: 38, wholesale_price: 28, image_url: "https://images.unsplash.com/photo-1575385151208-50d7af644e30?w=300" },
  { name: "Sooji / Rava 500g", category: "Groceries", mrp: 35, wholesale_price: 28, image_url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300" },
  { name: "Maida 1kg", category: "Groceries", mrp: 42, wholesale_price: 34, image_url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300" },
  { name: "Mustard Seeds 100g", category: "Groceries", mrp: 22, wholesale_price: 15, image_url: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300" },
  { name: "Cumin Seeds 100g", category: "Groceries", mrp: 30, wholesale_price: 22, image_url: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300" },

  // ── DAIRY ──
  { name: "Amul Taaza Milk 1L", category: "Dairy", mrp: 68, wholesale_price: 58, image_url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300" },
  { name: "Amul Butter 100g", category: "Dairy", mrp: 58, wholesale_price: 48, image_url: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300" },
  { name: "Amul Paneer 200g", category: "Dairy", mrp: 90, wholesale_price: 75, image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300" },
  { name: "Amul Dahi 400g", category: "Dairy", mrp: 48, wholesale_price: 38, image_url: "https://images.unsplash.com/photo-1571212515416-fca1f564d3e4?w=300" },
  { name: "Amul Cheese Slices 200g", category: "Dairy", mrp: 130, wholesale_price: 110, image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=300" },
  { name: "Nandini Curd 500g", category: "Dairy", mrp: 40, wholesale_price: 32, image_url: "https://images.unsplash.com/photo-1571212515416-fca1f564d3e4?w=300" },
  { name: "Amul Gold Milk 500ml", category: "Dairy", mrp: 32, wholesale_price: 27, image_url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300" },
  { name: "Mother Dairy Lassi 200ml", category: "Dairy", mrp: 25, wholesale_price: 20, image_url: "https://images.unsplash.com/photo-1571212515416-fca1f564d3e4?w=300" },

  // ── SNACKS ──
  { name: "Lay's Classic Salted 26g", category: "Snacks", mrp: 20, wholesale_price: 15, image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300" },
  { name: "Kurkure Masala Munch 70g", category: "Snacks", mrp: 30, wholesale_price: 22, image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300" },
  { name: "Parle-G Biscuits 800g", category: "Snacks", mrp: 80, wholesale_price: 65, image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300" },
  { name: "Britannia Good Day 200g", category: "Snacks", mrp: 30, wholesale_price: 23, image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300" },
  { name: "Maggi 2-Minute Noodles 4-pack", category: "Snacks", mrp: 72, wholesale_price: 58, image_url: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300" },
  { name: "Haldiram's Mixture 200g", category: "Snacks", mrp: 70, wholesale_price: 55, image_url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300" },
  { name: "Bikaji Bhujia 200g", category: "Snacks", mrp: 65, wholesale_price: 50, image_url: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300" },
  { name: "Oreo Original Cookies 300g", category: "Snacks", mrp: 100, wholesale_price: 82, image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300" },
  { name: "Dark Fantasy Choco Fills 300g", category: "Snacks", mrp: 130, wholesale_price: 105, image_url: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300" },
  { name: "Pringles Original 107g", category: "Snacks", mrp: 155, wholesale_price: 125, image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300" },
  { name: "Too Yumm! Multigrain 50g", category: "Snacks", mrp: 20, wholesale_price: 14, image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300" },

  // ── BEVERAGES ──
  { name: "Coca-Cola 750ml", category: "Beverages", mrp: 45, wholesale_price: 36, image_url: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300" },
  { name: "Sprite 750ml", category: "Beverages", mrp: 45, wholesale_price: 36, image_url: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=300" },
  { name: "Tropicana Orange Juice 1L", category: "Beverages", mrp: 110, wholesale_price: 88, image_url: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300" },
  { name: "Real Guava Juice 1L", category: "Beverages", mrp: 95, wholesale_price: 76, image_url: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300" },
  { name: "Mountain Dew 750ml", category: "Beverages", mrp: 45, wholesale_price: 36, image_url: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300" },
  { name: "Bisleri Water 1L", category: "Beverages", mrp: 20, wholesale_price: 14, image_url: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300" },
  { name: "Red Bull Energy Drink 250ml", category: "Beverages", mrp: 125, wholesale_price: 100, image_url: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=300" },
  { name: "Paper Boat Aam Panna 250ml", category: "Beverages", mrp: 30, wholesale_price: 22, image_url: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=300" },
  { name: "Horlicks 500g", category: "Beverages", mrp: 310, wholesale_price: 255, image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300" },
  { name: "Boost 500g", category: "Beverages", mrp: 295, wholesale_price: 240, image_url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300" },

  // ── PERSONAL CARE ──
  { name: "Colgate MaxFresh Toothpaste 150g", category: "Personal Care", mrp: 105, wholesale_price: 84, image_url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300" },
  { name: "Oral-B Toothbrush Medium", category: "Personal Care", mrp: 50, wholesale_price: 38, image_url: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300" },
  { name: "Dove Soap 100g", category: "Personal Care", mrp: 48, wholesale_price: 38, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Pears Soap 125g", category: "Personal Care", mrp: 55, wholesale_price: 44, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Head & Shoulders Shampoo 340ml", category: "Personal Care", mrp: 270, wholesale_price: 220, image_url: "https://images.unsplash.com/photo-1521305916504-4a1121188589?w=300" },
  { name: "Pantene Conditioner 200ml", category: "Personal Care", mrp: 220, wholesale_price: 178, image_url: "https://images.unsplash.com/photo-1521305916504-4a1121188589?w=300" },
  { name: "Himalaya Face Wash 150ml", category: "Personal Care", mrp: 130, wholesale_price: 104, image_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300" },
  { name: "Nivea Moisturizer 200ml", category: "Personal Care", mrp: 240, wholesale_price: 192, image_url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300" },
  { name: "Dettol Handwash 200ml", category: "Personal Care", mrp: 85, wholesale_price: 68, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Parachute Coconut Oil 200ml", category: "Personal Care", mrp: 95, wholesale_price: 76, image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300" },

  // ── MEDICINES (OTC) ──
  { name: "Dolo 650 Paracetamol (15 tabs)", category: "Medicines", mrp: 32, wholesale_price: 24, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Crocin Pain Relief (15 tabs)", category: "Medicines", mrp: 36, wholesale_price: 28, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Disprin Tablet (10 tabs)", category: "Medicines", mrp: 15, wholesale_price: 10, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Ibuprofen 400mg (10 tabs)", category: "Medicines", mrp: 22, wholesale_price: 16, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Cetirizine 10mg Antiallergy (10 tabs)", category: "Medicines", mrp: 28, wholesale_price: 20, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "ENO Fruit Salt Original 30g", category: "Medicines", mrp: 90, wholesale_price: 72, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Gelusil Antacid Syrup 200ml", category: "Medicines", mrp: 95, wholesale_price: 76, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "ORS Electrolyte Powder (5 sachets)", category: "Medicines", mrp: 55, wholesale_price: 42, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Vicks VapoRub 50g", category: "Medicines", mrp: 120, wholesale_price: 96, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Burnol Antiseptic Cream 20g", category: "Medicines", mrp: 80, wholesale_price: 64, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Band-Aid Sterile Bandages (10pc)", category: "Medicines", mrp: 75, wholesale_price: 58, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Digene Antacid Tablet (20 tabs)", category: "Medicines", mrp: 65, wholesale_price: 50, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Strepsils Throat Lozenges (24 tabs)", category: "Medicines", mrp: 120, wholesale_price: 96, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Volini Pain Relief Spray 100g", category: "Medicines", mrp: 260, wholesale_price: 208, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },
  { name: "Vitamin C 500mg (30 tabs)", category: "Medicines", mrp: 180, wholesale_price: 144, image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300" },

  // ── STATIONERY ──
  { name: "Reynolds Racer Ballpoint Pen (Pack of 5)", category: "Stationery", mrp: 45, wholesale_price: 32, image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300" },
  { name: "Cello Butterflow Pen (Pack of 10)", category: "Stationery", mrp: 60, wholesale_price: 45, image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300" },
  { name: "Pilot V7 Rollerball Pen", category: "Stationery", mrp: 50, wholesale_price: 38, image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300" },
  { name: "Faber-Castell Pencils HB (Pack of 10)", category: "Stationery", mrp: 80, wholesale_price: 62, image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300" },
  { name: "Natraj Sharpener", category: "Stationery", mrp: 10, wholesale_price: 6, image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300" },
  { name: "Apsara Eraser (Pack of 3)", category: "Stationery", mrp: 15, wholesale_price: 10, image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300" },
  { name: "A4 Ruled Notebook 200 pages", category: "Stationery", mrp: 90, wholesale_price: 68, image_url: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300" },
  { name: "Classmate Single Line Notebook", category: "Stationery", mrp: 55, wholesale_price: 42, image_url: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300" },
  { name: "Sticky Notes (100 sheets)", category: "Stationery", mrp: 60, wholesale_price: 45, image_url: "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300" },
  { name: "Stapler with 1000 Staples", category: "Stationery", mrp: 120, wholesale_price: 90, image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300" },
  { name: "Scissors (Medium)", category: "Stationery", mrp: 65, wholesale_price: 48, image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300" },
  { name: "Fevicol Glue 50g", category: "Stationery", mrp: 35, wholesale_price: 25, image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300" },
  { name: "Scotch Tape 24mm", category: "Stationery", mrp: 30, wholesale_price: 22, image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300" },
  { name: "Highlighter Set (4 colors)", category: "Stationery", mrp: 95, wholesale_price: 72, image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300" },
  { name: "Whiteboard Marker (Pack of 4)", category: "Stationery", mrp: 120, wholesale_price: 90, image_url: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300" },

  // ── HOUSEHOLD ──
  { name: "Ariel Detergent Powder 1kg", category: "Household", mrp: 180, wholesale_price: 148, image_url: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=300" },
  { name: "Vim Dishwash Bar 300g", category: "Household", mrp: 40, wholesale_price: 30, image_url: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=300" },
  { name: "Harpic Toilet Cleaner 1L", category: "Household", mrp: 145, wholesale_price: 115, image_url: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=300" },
  { name: "Colin Glass Cleaner 500ml", category: "Household", mrp: 110, wholesale_price: 88, image_url: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=300" },
  { name: "Lizol Floor Cleaner 500ml", category: "Household", mrp: 135, wholesale_price: 108, image_url: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=300" },
  { name: "Comfort Fabric Softener 800ml", category: "Household", mrp: 180, wholesale_price: 144, image_url: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=300" },
  { name: "Mortein Cockroach Spray 300ml", category: "Household", mrp: 230, wholesale_price: 184, image_url: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=300" },
  { name: "All Out Mosquito Liquid Refill", category: "Household", mrp: 175, wholesale_price: 140, image_url: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=300" },
  { name: "Garbage Bags (30 bags)", category: "Household", mrp: 65, wholesale_price: 48, image_url: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=300" },
  { name: "Scrubber Sponge (Pack of 3)", category: "Household", mrp: 50, wholesale_price: 36, image_url: "https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=300" },

  // ── BABY & KIDS ──
  { name: "Pampers Diapers Small (20 count)", category: "Baby & Kids", mrp: 299, wholesale_price: 245, image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300" },
  { name: "Johnson's Baby Powder 200g", category: "Baby & Kids", mrp: 110, wholesale_price: 88, image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300" },
  { name: "Johnson's Baby Shampoo 200ml", category: "Baby & Kids", mrp: 175, wholesale_price: 140, image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300" },
  { name: "Cerelac Stage 1 (Stage 1) 300g", category: "Baby & Kids", mrp: 210, wholesale_price: 170, image_url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300" },

  // ── FRESH PRODUCE ──
  { name: "Onions 1kg", category: "Fresh Produce", mrp: 45, wholesale_price: 35, image_url: "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=300" },
  { name: "Tomatoes 500g", category: "Fresh Produce", mrp: 30, wholesale_price: 22, image_url: "https://images.unsplash.com/photo-1546470427-227c5b013175?w=300" },
  { name: "Potatoes 1kg", category: "Fresh Produce", mrp: 38, wholesale_price: 28, image_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300" },
  { name: "Ginger 100g", category: "Fresh Produce", mrp: 20, wholesale_price: 14, image_url: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300" },
  { name: "Garlic 100g", category: "Fresh Produce", mrp: 22, wholesale_price: 16, image_url: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=300" },
  { name: "Lemon (Pack of 6)", category: "Fresh Produce", mrp: 25, wholesale_price: 18, image_url: "https://images.unsplash.com/photo-1519996409144-56c88c91349d?w=300" },
  { name: "Banana (Dozen)", category: "Fresh Produce", mrp: 55, wholesale_price: 42, image_url: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=300" },
  { name: "Apple Shimla (500g)", category: "Fresh Produce", mrp: 90, wholesale_price: 72, image_url: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=300" },
];

async function seed() {
  console.log(`\nSeeding ${products.length} products into Appwrite...\n`);
  let success = 0;
  let failed = 0;

  for (const product of products) {
    try {
      await databases.createDocument(DB_ID, COL_ID, sdk.ID.unique(), product);
      console.log(`  ✅ ${product.name}`);
      success++;
    } catch (err) {
      console.error(`  ❌ FAILED: ${product.name} → ${err.message}`);
      failed++;
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n══════════════════════════════`);
  console.log(`✅ Seeded: ${success} products`);
  console.log(`❌ Failed: ${failed} products`);
  console.log(`══════════════════════════════\n`);
}

seed();
