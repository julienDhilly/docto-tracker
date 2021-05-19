/* eslint-disable no-console */
import config from 'config';
import Crawler from 'crawler';
import { sendAlert } from './lib/notifier';

// stop the script when a slot found.
// TODO: Check if slot alert as already been send and keep crawling
let find = false;

const c = new Crawler({
  maxConnections: 6,
  rateLimit: 1000,
  jQuery: false,
  // This will be called for each crawled page
  callback: (error, res, done) => {
    if (error) {
      console.log(error);
    } else {
      const result = JSON.parse(res.body);
      try {
        const allowed = config
          .get('allowedCities')
          .find((str) => result.search_result.url.includes(`/${str}/`));
        if (!allowed) {
          console.log(result.search_result.id, 'ignore');
          done();
          return;
        }
        if (result.total > 0) {
          find = true;
          console.log(result);
          console.log(
            result.search_result.id,
            'YEAH',
            result.search_result.url,
          );
          sendAlert(result.search_result, config.get('phoneNumbers'));
        } else {
          console.log(result.search_result.id, 'No slot found');
        }
      } catch (err) {
        console.error(err);
      }
    }
    done();
  },
});

function addQueues(ids) {
  c.queue(
    ids.map((id) => `https://www.doctolib.fr/search_results/${id}.json?ref_visit_motive_ids%5B%5D=6970&ref_visit_motive_ids%5B%5D=7005&speciality_id=5494&search_result_format=json&force_max_limit=2`),
  );
}

function parseIds(page) {
  const ids = [];
  const regex = /data-props="{&quot;searchResultId&quot;:([0-9]+),&quot;/gm;
  let regResult = null;
  // eslint-disable-next-line no-cond-assign
  while (regResult = regex.exec(page) !== null) {
    ids.push(regResult[1]);
  }
  return ids;
}

function start() {
  c.queue({
    uri: 'https://www.doctolib.fr/vaccination-covid-19/rennes?ref_visit_motive_ids[]=6970&ref_visit_motive_ids[]=7005&force_max_limit=2',
    callback: (error, res, done) => {
      if (error) {
        console.log(error);
      } else {
        const ids = parseIds(res.body);
        console.log('-------------------------');
        console.log('SET OF IDS', JSON.stringify(ids));
        addQueues(ids);
      }

      done();
    },
  });
}

start();

c.on('drain', () => {
  if (!find) {
    start();
  }
});
