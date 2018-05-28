module.exports = function (sequelize, DataTypes) {
    const SavedTrip = sequelize.define('SavedTrip', {}, { timestamps: false })

    return SavedTrip
}