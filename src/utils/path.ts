import { TFile } from 'obsidian';
import path from 'path';
import CommonplaceNotesPublisherPlugin from '../main';

export class PathUtils {
	static sluggify(s: string): string {
		return s
			.split("/")
			.map((segment) =>
				segment
					.replace(/\s/g, "-")
					.replace(/&/g, "-and-")
					.replace(/%/g, "-percent")
					.replace(/\?/g, "")
					.replace(/#/g, "")
			)
			.join("/") // always use / as sep
			.replace(/\/$/, "")
	}

	static slugifyFilePath(fp: string, excludeExt?: boolean): string {
		// Remove leading/trailing slashes
		fp = fp.replace(/^\/+|\/+$/g, "")

		// Get file extension
		let ext = fp.match(/\.[A-Za-z0-9]+$/)?.[0] ?? ""
		const withoutFileExt = fp.replace(new RegExp(ext + "$"), "")

		if (excludeExt || [".md", ".html", undefined].includes(ext)) {
			ext = ""
		}

		let slug = PathUtils.sluggify(withoutFileExt)

		return slug + ext
	}

	static stripSlashes(s: string, onlyStripPrefix?: boolean): string {
		if (s.startsWith("/")) {
			s = s.substring(1)
		}

		if (!onlyStripPrefix && s.endsWith("/")) {
			s = s.slice(0, -1)
		}

		return s
	}

	static simplifySlug(fp: string): string {
		const trimSuffix = (s: string, suffix: string): string => {
			const endsWith = s === suffix || s.endsWith("/" + suffix);
			return endsWith ? s.slice(0, -suffix.length) : s;
		}

		let slug = PathUtils.stripSlashes(trimSuffix(fp, "index"), true)
		return slug.length === 0 ? "/" : slug
	}

	// Helper function to create relative paths
	static createRelativePath(fromSlug: string, toSlug: string): string {
		// Convert slugs to directory-like paths
		const fromParts = fromSlug.split('/');
		const toParts = toSlug.split('/');

		// Remove the filename part from fromParts
		fromParts.pop();

		// Calculate the relative path
		const relativePath = path.relative(
			fromParts.join('/'),
			toParts.join('/')
		);

		// Ensure the path starts with ./ or ../
		return relativePath.startsWith('.')
			? relativePath + '.html'
			: './' + relativePath + '.html';
	}

	static async ensureDirectory(plugin: CommonplaceNotesPublisherPlugin, targetPath: string): Promise<void> {
		// Normalize the path to handle different path separators
		const normalizedPath = targetPath.replace(/\\/g, '/');
		const dirPath = path.dirname(normalizedPath);

		if (!(await plugin.app.vault.adapter.exists(dirPath))) {
			await plugin.app.vault.adapter.mkdir(dirPath);
		}
	}

	async deleteFilesInDirectory(plugin: CommonplaceNotesPublisherPlugin, directory: string) {
		try {
			const adapter = plugin.app.vault.adapter;
			const files = await adapter.list(directory);

			for (const file of files.files) {
				await adapter.remove(file);
				console.log(`Deleted: ${file}`);
			}
		} catch (error) {
			console.error(`Error deleting files in ${directory}:`, error);
			throw error;
		}
	}
}