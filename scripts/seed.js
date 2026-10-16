require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
// Load from prisma/seed.js
require('../prisma/seed.js')
