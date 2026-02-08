ALTER TABLE list_items
  DROP CONSTRAINT list_items_kind_check,
  DROP COLUMN kind,
  DROP COLUMN name,
  DROP COLUMN note;
