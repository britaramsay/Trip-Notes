USE tripnotes_db;

INSERT INTO users (id, AuthID, CreatedAt, UpdatedAt) VALUES 
(1, 4237, 19980101, 20180814), (2, 6547, 20180814, 20180814), (3, 2454, 20180814, 20180814);

INSERT INTO trips (id, Title, Description, Private, createdAt, updatedAt, UserId) VALUES
(1, 'Disney Trip', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a neque cursus, convallis orci eget, mattis est.', false, 20180814, 20180814, 1), 
(2, 'Going to Japan!', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a neque cursus, convallis orci eget, mattis est.', false, 20180814, 20180814, 1), 
(3, 'Summer, NYC', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a neque cursus, convallis orci eget, mattis est.', true, 20180814, 20180814, 2), 
(4, 'Seattle Coffee Trip', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a neque cursus, convallis orci eget, mattis est.', false, 20180814, 20180814, 2), 
(5, 'California 2018', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed a neque cursus, convallis orci eget, mattis est.', false, 20180814, 20180814, 2);

INSERT INTO savedtrips VALUES
(1, 3, 3), (2, 4, 1), (3, 2, 2), (4, 2, 3);

INSERT INTO tags VALUES
(1, 'Florida'), (2, 'Rides'), (3, 'Coffee'), (4, 'Summer'), 
(5, 'Snow'), (6, '2018'), (7, 'Spring Break'), (8, 'Airport'), 
(9, 'Lorem'), (10, 'Ipsum'), (11, 'dolor'), (12, 'sit amet');

INSERT INTO triptags VALUES
(1, 1, 1), (2, 2, 1), (3, 3, 4), (4, 4, 5), 
(5, 7, 2), (6, 6, 5), (7, 5, 4), (8, 8, 2), 
(9, 9, 5), (10, 10, 5), (11, 11, 2), (12, 12, 3);

SELECT * FROM trips INNER JOIN users ON trips.UserId = users.id;