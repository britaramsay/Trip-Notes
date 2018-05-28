module.exports = function (sequelize, DataTypes) {
    const NoteTag = sequelize.define('NoteTag', {}, { timestamps: false })

    return NoteTag
}