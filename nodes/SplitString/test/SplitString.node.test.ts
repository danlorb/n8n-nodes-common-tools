import { mock } from 'jest-mock-extended';

import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { SplitString } from '../SplitString.node';

describe('Topic', () => {
	const executeFunctions = mock<IExecuteFunctions>();

	beforeEach(() => {
		jest.clearAllMocks();

		executeFunctions.getInputData.mockReturnValue([
			{ json: { message: 'off', topic: 'smarthome/room/office/switch' } },
		]);

		executeFunctions.getNodeParameter
			.calledWith('value', 0)
			.mockReturnValue('smarthome/room/office/switch');
		executeFunctions.getNodeParameter.calledWith('separator', 0).mockReturnValue('/');
	});

	afterAll(() => {
		jest.unmock('../SplitString.node');
	});

	test('should split topic in parts and return all items', async () => {
		const items: INodeExecutionData[][] = await new SplitString().execute.call(executeFunctions);

		expect(items).not.toBeNull();
		items[0].forEach((x) => {
			const jsonItem = x.json as {
				item: string;
			};

			expect(jsonItem).not.toBeNull();
			expect(jsonItem.item).not.toBeUndefined();
			expect(['smarthome', 'room', 'office', 'switch']).toContain(jsonItem.item);
		});
	});

	test('should split topic in parts, return all items and include input fields', async () => {
		executeFunctions.getNodeParameter.calledWith('options', 0).mockReturnValue({
			inputFields: 'message,topic',
		});

		const items: INodeExecutionData[][] = await new SplitString().execute.call(executeFunctions);
		expect(items).not.toBeNull();
		items[0].forEach((x) => {
			const jsonItem = x.json as {
				item: string;
				message: string;
				topic: string;
			};

			expect(jsonItem).not.toBeNull();
			expect(jsonItem.item).not.toBeUndefined();
			expect(jsonItem.message).not.toBeUndefined();
			expect(jsonItem.topic).not.toBeUndefined();
			expect(['smarthome', 'room', 'office', 'switch']).toContain(jsonItem.item);
		});
	});

	test('should split topic in parts map specific items', async () => {
		executeFunctions.getNodeParameter.calledWith('options', 0).mockReturnValue({
			mappings: {
				values: [{ name: 'room', index: 2 }],
			},
		});

		const items: INodeExecutionData[][] = await new SplitString().execute.call(executeFunctions);
		expect(items).not.toBeNull();
		items[0].forEach((x) => {
			const jsonItem = x.json as {
				room: string;
			};

			expect(jsonItem).not.toBeNull();
			expect(jsonItem.room).not.toBeUndefined();
			expect(jsonItem.room).toEqual('office');
		});
	});

	test('should split topic in parts, map specific items and include input fields', async () => {
		executeFunctions.getNodeParameter.calledWith('options', 0).mockReturnValue({
			mappings: {
				values: [{ name: 'room', index: 2 }],
			},
			inputFields: 'message, topic',
		});

		const items: INodeExecutionData[][] = await new SplitString().execute.call(executeFunctions);
		expect(items).not.toBeNull();
		items[0].forEach((x) => {
			const jsonItem = x.json as {
				room: string;
				message: string;
				topic: string;
			};

			expect(jsonItem).not.toBeNull();
			expect(jsonItem.room).not.toBeUndefined();
			expect(jsonItem.room).toEqual('office');
			expect(jsonItem.message).not.toBeUndefined();
			expect(jsonItem.topic).not.toBeUndefined();
		});
	});
});
