import { CommandStore, KlasaMessage } from 'klasa';
import { Monsters } from 'oldschooljs';

import { BotCommand } from '../../lib/BotCommand';
import { PerkTier } from '../../lib/constants';
import { stringMatches } from '../../lib/util';
import getOSItem from '../../lib/util/getOSItem';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			perkTier: PerkTier.Four,
			usage: '<monsterName:str> <itemName:str>',
			oneAtTime: true,
			cooldown: 120,
			usageDelim: ','
		});
	}

	async run(msg: KlasaMessage, [monName, itemName]: [string, string]) {
		const mon = Monsters.find(mon => mon.aliases.some(alias => stringMatches(alias, monName)));

		if (!mon) {
			throw `That's not a valid monster.`;
		}

		const item = getOSItem(itemName);

		const result = await this.client.query<
			{
				id: string;
				KC: string;
			}[]
		>(
			`SELECT "id", "monsterScores"->>'${mon.id}' AS "KC" FROM users WHERE "collectionLogBank"->>'${item.id}' IS NULL AND "monsterScores"->>'${mon.id}' IS NOT NULL ORDER BY ("monsterScores"->>'${mon.id}')::int DESC LIMIT 10;`
		);

		if (result.length === 0) throw `No results found.`;

		const command = this.client.commands.get('leaderboard');

		return msg.send(
			`**Dry Streaks for ${item.name} from ${mon.name}:**\n${result
				.map(
					({ id, KC }) =>
						// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
						// @ts-ignore
						`${command.getUsername(id) as string}: ${parseInt(KC).toLocaleString()}`
				)
				.join('\n')}`
		);
	}
}
