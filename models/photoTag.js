module.exports = function (sequelize, DataTypes) {
    const PhotoTag = sequelize.define('PhotoTag', {}, { timestamps: false })

    return PhotoTag
}