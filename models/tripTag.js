module.exports = function (sequelize, DataTypes) {
    const TripTag = sequelize.define('TripTag', {}, { timestamps: false })

    return TripTag
}