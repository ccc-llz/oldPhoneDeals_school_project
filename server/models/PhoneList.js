const mongoose = require('./db')

const PhoneListSchema = new mongoose.Schema(
    {
        title: String,
        brand: String,
        image: String,
        stock: Number,
        seller: String,
        price: Number,
        disabled: mongoose.Schema.Types.Mixed,
        reviews:[
          {
            reviewer: String, 
            rating: Number,
            comment: String,
            hidden: mongoose.Schema.Types.Mixed
          }
        ],
    },
    {
        versionKey: false
    })

PhoneListSchema.statics.test = function(brand, limit){
    return this.find({'brand':brand})
    .limit(limit)
}

const PhoneList = mongoose.model('phonelisting', PhoneListSchema, 'phonelisting')

module.exports = PhoneList