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
        User.hasMany(models.Trip)
        User.hasMany(models.SavedTrip)
    }
    return User
}