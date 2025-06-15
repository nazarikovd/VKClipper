import React, { useState, useEffect } from "react";

import {
	Group,
	Placeholder,
	Div,
	Button,
	Header,
	Spinner
} from "@vkontakte/vkui";

import {
	Icon28AddOutline
} from "@vkontakte/icons";

import GroupCell from "./Group/GroupCell";
import GroupModal from "./Group/GroupModal";

const Groups = ({ api }) => {
	const [groups, setGroups] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [activeModal, setActiveModal] = useState(null);

	const fetchGroups = async () => {
		setLoading(true);
		try {
			const response = await api.call("groups.get");
			setGroups(response.response);
			setError(null);
		} catch (err) {
			setError(err.error_msg || "Failed to load groups");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchGroups();
		// eslint-disable-next-line
	}, []);

	const handleDeleteGroup = async (groupId) => {
		try {
			await api.call("groups.delete", { group_id: groupId });
			await fetchGroups();
		} catch (err) {
			setError(err.error_msg || "Failed to delete group");
		}
	};

	if (loading && groups.length === 0) {
		return (
			<Group>
				<Div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
					<Spinner />
				</Div>
			</Group>
		);
	}

	return (
		<>
			{groups.length === 0 ? (
				<Group>
					<Placeholder
						action={
							<Button
								onClick={() => setActiveModal("add")}
								size="m"
								before={<Icon28AddOutline />}
							>
								Новая группа
							</Button>
						}
					></Placeholder>
				</Group>
			) : (
				<>
					<Group header={<Header size="s">Управление группами</Header>}>
						<Div>
							<Button
								onClick={() => setActiveModal("add")}
								size="m"
								before={<Icon28AddOutline />}
								stretched
								mode="secondary"
							>
								Добавить группу
							</Button>
						</Div>
					</Group>
					<Group header={<Header size="s">Список групп • {groups.length}</Header>}>
						{groups.map((group, index) => (
							<GroupCell
								key={index}
								group={group}
								onDelete={handleDeleteGroup}
							/>
						))}
					</Group>
				</>
			)}

			<GroupModal
				activeModal={activeModal}
				setActiveModal={setActiveModal}
				api={api}
				setError={setError}
				error={error}
				fetchGroups={fetchGroups}
			/>
		</>
	);
};

export default Groups;
