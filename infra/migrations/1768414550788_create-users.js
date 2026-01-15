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
      type: 'varchar(60)', //Why 60 in length? (bcrypt hashing always returns hashes of size 60)
      notNull: true,
    },
    created_at: {
      type: 'timestamptz',
      default: pgm.func("timezone('utc',now())"),
      notNull: true,
    },
    updated_at: {
      type: 'timestamptz',
      default: pgm.func("timezone('utc',now())"),
      notNull: true,
    },
  });
};

exports.down = false;
