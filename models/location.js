module.exports = function (sequelize, DataTypes) {
    const Location = sequelize.define('Location', {
        ApiID: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        Name: DataTypes.STRING,
        Lat: DataTypes.DECIMAL(10, 8),
        Lng: DataTypes.DECIMAL(11, 8)
    }, { timestamps: false })

    Location.associate = (models) => {
        Location.hasMany(models.Checkin, { onDelete: 'CASCADE' })
    }

    return Location
}