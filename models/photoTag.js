module.exports = function (sequelize, DataTypes) {
    const PhotoTag = sequelize.define('PhotoTag', {}, { timestamps: false })

    PhotoTag.associate = (models) => {
        PhotoTag.belongsTo(models.Tag)
        PhotoTag.belongsTo(models.Photo)
    }

    return PhotoTag
}