exports.up = (pgm) => {
  pgm.createTable('users', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    username: {
      type: 'varchar(30)', //For reference, Github limits usernames to 39 characters.
      notNull: true,
      unique: true,
    },
    email: {
      type: 'varchar(254)', //Why 254 in length? (Maximum email length by standard)
      notNull: true,
      unique: true,
    },
    password: {
      type: 'varchar(72)', //Why 72 in length? (bcrypt hashing truncates password size to 72)
      notNull: true,
    },
    created_at: {
      type: 'timestamptz',
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      default: pgm.func('now()'),
    },
  });
};

exports.down = false;
