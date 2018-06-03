module.exports = function (sequelize, DataTypes) {
    const Photo = sequelize.define('Photo', {
        URL: {
            type: DataTypes.STRING,
            allowNull: false
        },
        Order: DataTypes.INTEGER
    })

    Photo.associate = (models) => {
        models.Checkin.hasMany(Photo, { onDelete: 'CASCADE' })
        Photo.belongsTo(models.Checkin)
    }

    return Photo
}