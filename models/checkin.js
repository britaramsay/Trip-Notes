module.exports = function (sequelize, DataTypes) {
    const Checkin = sequelize.define('Checkin', {
        Order: DataTypes.INTEGER
    })

    //TODO: relationships
    Checkin.associate = (models) => {
        Checkin.belongsTo(models.Trip)
        Checkin.belongsTo(models.Location)
        Checkin.hasMany(models.Note, { onDelete: 'CASCADE' })
        Checkin.belongsToMany(models.Tag, { through: models.CheckinTag })
    }

    return Checkin
}