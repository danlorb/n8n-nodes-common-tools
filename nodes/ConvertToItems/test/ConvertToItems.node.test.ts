import { mock } from 'jest-mock-extended';

import { IExecuteFunctions } from 'n8n-workflow';
import { ConvertToItems } from '../ConvertToItems.node';

describe('Topic', () => {
	const executeFunctions = mock<IExecuteFunctions>();

	beforeEach(() => {
		jest.clearAllMocks();

		executeFunctions.getNodeParameter.calledWith('table', 0).mockReturnValue(`
| entity_id       | room    | boot | shutdown |
| --------------- | ------- | ---- | -------- |
| switch.off_st_1 | office  | on   | off      |
| switch.off_st_2 | office  | off  |          |
| switch.kit_st_1 | kitchen | off  | off      |
| switch.liv_st_1 | living  |      | off      |
| switch.bat_st_1 | bath    | on   | on       |
			`);
	});

	afterAll(() => {
		jest.unmock('../ConvertToItems.node');
	});

	test('should parse a markdown table as object', async () => {
		const items: any = await new ConvertToItems().execute.call(executeFunctions);
		expect(items).not.toBeNull();
		expect(items[0][0].json.room).toEqual('office');
		expect(items[0][4].json.room).toEqual('bath');
	});

	test('should parse a markdown table and filter the result', async () => {
		executeFunctions.getNodeParameter.calledWith('search', 0).mockReturnValue('office');
		executeFunctions.getNodeParameter.calledWith('key', 0).mockReturnValue('room');
		executeFunctions.getNodeParameter.calledWith('include', 0).mockReturnValue('boot');

		const items: any = await new ConvertToItems().execute.call(executeFunctions);
		expect(items).not.toBeNull();
		expect(items[0][0].json.room).toEqual('office');
	});
});
