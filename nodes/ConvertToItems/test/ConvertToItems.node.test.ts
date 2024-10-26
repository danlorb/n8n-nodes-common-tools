import { mock } from 'jest-mock-extended';

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ConvertToItems } from '../ConvertToItems.node';

describe('Topic', () => {
	const executeFunctions = mock<IExecuteFunctions>();

	beforeEach(() => {
		jest.clearAllMocks();

		const table = `
| entity_id       | room    | boot | shutdown |
| --------------- | ------- | ---- | -------- |
| switch.off_st_1 | office  | on   | off      |
| switch.off_st_2 | office  | off  |          |
| switch.kit_st_1 | kitchen | off  | off      |
| switch.liv_st_1 | living  |      | off      |
| switch.bat_st_1 | bath    | on   | on       |
`;

		executeFunctions.getInputData.mockReturnValue([
			{ json: { message: 'off', topic: 'smarthome/room/office/switch' } },
		]);
		executeFunctions.getNodeParameter.calledWith('table', 0).mockReturnValue(table);
		executeFunctions.getNodeParameter.calledWith('options', 0).mockReturnValue({
			includeRowsWithEmptyFields: false,
		});
	});

	afterAll(() => {
		jest.unmock('../ConvertToItems.node');
	});

	test('should only return input data', async () => {
		const items: INodeExecutionData[][] = await new ConvertToItems().execute.call(executeFunctions);

		expect(items).not.toBeNull();
		items[0].forEach(x => expect(x.json).not.toBeNull());
	});

	test('should parse a markdown table and return only field rooms', async () => {
		executeFunctions.getNodeParameter.calledWith('include', 0).mockReturnValue('room');

		const items: INodeExecutionData[][] = await new ConvertToItems().execute.call(executeFunctions);
		expect(items).not.toBeNull();
		items[0].forEach(x =>{
			const item = x.json as {
				room: string
			};

			expect(item).not.toBeNull();
			expect(item.room).not.toBeUndefined();
			expect(['office', 'bath', 'kitchen', 'living']).toContain(item.room);
		});
	});

	test('should parse a markdown table, filter for room office and return the result', async () => {
		executeFunctions.getNodeParameter.calledWith('search', 0).mockReturnValue('office');
		executeFunctions.getNodeParameter.calledWith('searchBy', 0).mockReturnValue('room');
		executeFunctions.getNodeParameter.calledWith('include', 0).mockReturnValue('entity_id,room,boot');

		const items: INodeExecutionData[][] = await new ConvertToItems().execute.call(executeFunctions);
		expect(items).not.toBeNull();
		items[0].forEach(x =>{
			const item = x.json as {
				entity_id: string;
				room: string,
				boot: string
			};

			expect(item).not.toBeNull();
			expect(item.room).not.toBeUndefined();
			expect(item.room).toEqual('office');
			expect(item.entity_id.startsWith('switch.off_st_')).toBeTruthy();
		});
	});

	test('should parse a markdown table, filter for room living and no result should returned', async () => {
		executeFunctions.getNodeParameter.calledWith('search', 0).mockReturnValue('living');
		executeFunctions.getNodeParameter.calledWith('searchBy', 0).mockReturnValue('room');
		executeFunctions.getNodeParameter.calledWith('include', 0).mockReturnValue('room,boot');

		const items: INodeExecutionData[][] = await new ConvertToItems().execute.call(executeFunctions);
		expect(items).not.toBeNull();
		expect(items[0][0]).not.toBeDefined();
	});

	test('should parse a markdown table, filter for room living and result should returned', async () => {
		executeFunctions.getNodeParameter.calledWith('search', 0).mockReturnValue('living');
		executeFunctions.getNodeParameter.calledWith('searchBy', 0).mockReturnValue('room');
		executeFunctions.getNodeParameter
			.calledWith('include', 0)
			.mockReturnValue('room,shutdown');

		const items: INodeExecutionData[][] = await new ConvertToItems().execute.call(executeFunctions);

		expect(items).not.toBeNull();
		items[0].forEach(x =>{
			const item = x.json as {
				room: string,
				shutdown: string
			};

			expect(item).not.toBeNull();
			expect(item.room).not.toBeUndefined();
			expect(item.room).toEqual('living');
			expect(item.shutdown).toEqual('off');
		});
	});

});
