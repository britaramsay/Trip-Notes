module.exports = function (sequelize, DataTypes) {
    const TripTag = sequelize.define('TripTag', {}, { timestamps: false })

    TripTag.associate = (models) => {
        TripTag.belongsTo(models.Tag)
        TripTag.belongsTo(models.Trip)
    }

    return TripTag
}