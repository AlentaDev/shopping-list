import ListsScreen from "./components/ListsScreen";

const Lists = () => {
  const handleAction = () => {};
  const handleCreate = () => {};

  return (
    <ListsScreen lists={[]} onAction={handleAction} onCreate={handleCreate} />
  );
};

export default Lists;
