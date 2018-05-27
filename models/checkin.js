module.exports = function (sequelize, DataTypes) {
    const Checkin = sequelize.define('Checkin', {
        Order: DataTypes.INTEGER
    })

    //TODO: relationships
    Checkin.associate = (models) => {
        Checkin.belongsTo(models.Trip)
        Checkin.belongsTo(models.Location)
        Checkin.hasMany(models.Note)
    }

    return Checkin
}