module.exports = function (sequelize, DataTypes) {
    const Photo = sequelize.define('Photo', {
        URL: {
            type: DataTypes.STRING,
            allowNull: false
        }, 
        Order: DataTypes.INTEGER
    })

    Photo.associate = (models) => {
        Photo.belongsTo(models.Checkin)
        Photo.hasMany(models.Note)
    }

    return Photo
}