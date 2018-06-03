module.exports = function (sequelize, DataTypes) {
    const Trip = sequelize.define('Trip', {
        Title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [1]
            }
        },
        Description: {
            type: DataTypes.STRING
        },
        Private: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    })

    Trip.assocate = (models) => {
        Trip.belongsTo(models.User)

        Trip.belongsToMany(models.Tag, { through: models.TripTag })
        Trip.belongsToMany(models.User, { through: models.SavedTrip })
    }

    return Trip
}