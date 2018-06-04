module.exports = function (sequelize, DataTypes) {
    const User = sequelize.define('User', {
        AuthID: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        }
    })

    //TODO: relationships
    User.associate = (models) => {
        User.hasMany(models.Trip, { onDelete: 'CASCADE' })
        
        User.belongsToMany(models.Trip, { through: models.SavedTrip })
    }
    return User
}