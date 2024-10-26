import { mock } from 'jest-mock-extended';

import { IExecuteFunctions } from 'n8n-workflow';
import { SplitString } from '../SplitString.node';
import { MappingField } from '../MappingField';

describe('Topic', () => {
	const executeFunctions = mock<IExecuteFunctions>();

	beforeEach(() => {
		jest.clearAllMocks();

		const fields: MappingField[] = [{ name: 'room', index: 1 }];

		executeFunctions.getInputData.mockReturnValue([
			{ json: { message: 'off', topic: 'smarthome/room/office/switch' } },
		]);
		executeFunctions.getNodeParameter
			.calledWith('value', 0)
			.mockReturnValue('smarthome/room/office/switch');
		executeFunctions.getNodeParameter.calledWith('separator', 0).mockReturnValue('/');
		executeFunctions.getNodeParameter
			.calledWith('mappings.values', 0)
			.mockReturnValue(fields);
		executeFunctions.getNodeParameter.calledWith('inputFields', 0).mockReturnValue('');
	});

	afterAll(() => {
		jest.unmock('../SplitString.node');
	});

	test('should split topic in parts', async () => {
		const items: any = await new SplitString().execute.call(executeFunctions);
		expect(items).not.toBeNull();
		expect(items[0][0].json.room).toEqual('room');
	});

	test('should split topic in parts and include input fields', async () => {
		executeFunctions.getNodeParameter.calledWith('inputFields', 0).mockReturnValue('topic');

		const items: any = await new SplitString().execute.call(executeFunctions);
		expect(items).not.toBeNull();
		expect(items[0][0].json.topic).not.toBeNull();
	});
});
