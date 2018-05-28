module.exports = function (sequelize, DataTypes) {
    const Tag = sequelize.define('Tag', {
        Name: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                len: [1],
            }
        }
    }, { timestamps: false })

    Tag.associate = (models) => {
        Tag.belongsToMany(models.Trip, { through: models.TripTag })
        Tag.belongsToMany(models.Checkin, { through: models.CheckinTag })
        Tag.belongsToMany(models.Note, { through: models.NoteTag })
        Tag.belongsToMany(models.Photo, { through: models.PhotoTag })
    }

    return Tag
}