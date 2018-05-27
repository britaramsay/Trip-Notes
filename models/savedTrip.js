module.exports = function (sequelize, DataTypes) {
    const SavedTrip = sequelize.define('SavedTrip', {}, { timestamps: false })

    //TODO: relationships
    SavedTrip.associate = (models) => {
        SavedTrip.belongsTo(models.Trip)
        SavedTrip.belongsTo(models.User)
    }
    return SavedTrip
}