import { BaseTool } from './base-tool.js';
import { ToolDefinition, McpToolResponse } from '../types.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';

const QUEUE_FILE = path.join(process.cwd(), 'queue.txt');

export class QueueDocumentationTool extends BaseTool {
  constructor() {
    super();
  }

  get definition(): ToolDefinition {
    return {
      name: 'queue_documentation',
      description: 'Add URLs to the documentation processing queue',
      inputSchema: {
        type: 'object',
        properties: {
          urls: {
            type: 'array',
            items: {
              type: 'string',
              description: 'URL of documentation to queue',
            },
            description: 'Array of URLs to add to the queue',
          },
        },
        required: ['urls'],
      },
    };
  }

  async execute(args: any): Promise<McpToolResponse> {
    if (!Array.isArray(args.urls)) {
      throw new McpError(ErrorCode.InvalidParams, 'urls must be an array');
    }

    if (args.urls.length === 0) {
      throw new McpError(ErrorCode.InvalidParams, 'urls array cannot be empty');
    }

    if (!args.urls.every((url: string) => typeof url === 'string')) {
      throw new McpError(ErrorCode.InvalidParams, 'all urls must be strings');
    }

    try {
      // Ensure queue file exists
      try {
        await fs.access(QUEUE_FILE);
      } catch {
        await fs.writeFile(QUEUE_FILE, '');
      }

      // Append URLs to queue file
      const urlsToAdd = args.urls.join('\n') + '\n';
      await fs.appendFile(QUEUE_FILE, urlsToAdd);

      return {
        content: [
          {
            type: 'text',
            text: `Successfully queued ${args.urls.length} URLs for processing`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to queue URLs: ${error}`,
          },
        ],
        isError: true,
      };
    }
  }
}