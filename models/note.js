module.exports = function (sequelize, DataTypes) {
    const Note = sequelize.define('Note', {
        Note: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                len: [1]
            }
        },
        Order: DataTypes.INTEGER
    })

    Note.associate = (models) => {
        Note.belongsTo(models.Checkin)
        Note.belongsTo(models.Photo)
        Note.belongsToMany(models.Tag, { through: models.NoteTag })
    }
    return Note
}