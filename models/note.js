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
        models.Checkin.hasMany(Note, { onDelete: 'CASCADE' })
        Note.belongsTo(models.Checkin)
    }
    return Note
}