import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

export class ConvertToItems implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Convert to Items',
		name: 'configToItems',
		icon: 'file:convertToItems.svg',
		group: ['transform'],
		version: 1,
		description: 'Converts a Markdown Table to a JSON Items',
		defaults: {
			name: 'Convert To Items',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Markdown Table',
				description: 'Markdown Table as String',
				name: 'table',
				type: 'string',
				required: true,
				default: '',
				typeOptions: {
					rows: 8,
				},
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				required: true,
				default: '',
				description: 'Value to search for in the defined search column',
			},
			{
				displayName: 'Search by Column',
				name: 'key',
				type: 'string',
				default: '',
				description: 'Define the column name which should be used for searching',
			},
			{
				displayName: 'Fields to Include',
				name: 'include',
				type: 'string',
				default: '',
				description: 'Comma-separated List of Fields to include in Result',
				placeholder: 'e.g. field1,field2',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const table = this.getNodeParameter('table', 0) as string;
		const search = this.getNodeParameter('search', 0) as string;
		const key = this.getNodeParameter('key', 0) as string;
		const include = this.getNodeParameter('include', 0) as string;

		const configs = ConvertToItems.convertTable(table, key, include);

		let result: INodeExecutionData[] = [];
		if (search && key) {
			configs.forEach((config) => {
				const value = config.json[key];
				if (value === search) {
					result.push(config);
				}
			});
		} else {
			result = configs;
		}

		return [result];
	}

	private static convertTable(table: string, key: string, fields: string): INodeExecutionData[] {
		const lines = table.split('\n');
		const filteredLines = lines.filter(
			(x) => !(x.startsWith('| -') || x.startsWith('|-')) && x.trim() !== '',
		);

		let validColumns: string[] = [];
		if (fields) {
			validColumns = fields.split(',');
		}

		if(key){
			validColumns.push(key);
		}

		const result: INodeExecutionData[] = [];

		const columns = filteredLines[0]
			.split('|')
			.filter((x) => x.trim() !== '')
			.map((x) => x.trim());

		filteredLines
			.slice(1)
			.map((row) => {
				return row
					.split('|')
					.filter((x) => x.trim() !== '')
					.map((x) => x.trim());
			})
			.forEach((x) => {
				const row: any = {};
				for (let i = 0; i < x.length; i++) {
					const column = columns[i];
					if (validColumns.length === 0 || validColumns.includes(column)) {
						const value = x[i];
						if (value) {
							row[column] = value;
						} else {
							row[column] = null;
						}
					}
				}

				if (row) {
					result.push({
						json: row,
					});
				}
			});

		return result;
	}
}
