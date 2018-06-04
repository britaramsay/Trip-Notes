module.exports = function (sequelize, DataTypes) {
    const Checkin = sequelize.define('Checkin', {
        Order: DataTypes.INTEGER
    })

    //TODO: relationships
    Checkin.associate = (models) => {
        models.Trip.hasMany(Checkin, { onDelete: 'CASCADE' })
        Checkin.belongsTo(models.Trip)

        models.Location.hasMany(Checkin, { onDelete: 'CASCADE' })
        Checkin.belongsTo(models.Location)

        Checkin.belongsToMany(models.Tag, { through: models.CheckinTag })
    }

    return Checkin
}