module.exports = function (sequelize, DataTypes) {
    const NoteTag = sequelize.define('NoteTag', {}, { timestamps: false })

    NoteTag.associate = (models) => {
        NoteTag.belongsTo(models.Tag)
        NoteTag.belongsTo(models.Note)
    }

    return NoteTag
}