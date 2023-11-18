import axios from 'axios';
// import nock from 'nock';
import { start as startServer, stop as stopServer } from '../../createServer';
import { version as packageVersion } from '../../../package.json';
import { serviceName } from '../../constants';

const baseUrl = `http://localhost:${process.env.SERVER_PORT}`;

type VersionInfoResponse = {
  [key: string]: {
    version: string;
  };
};

describe('get app version', () => {
  beforeAll(async () => {
    await startServer();
  });

  afterAll(async () => {
    await stopServer();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  it('expect to get version info', async () => {
    const versionInfoPath = '/api/v1/version';
    const expectedResponse: VersionInfoResponse = {
      [serviceName]: {
        version: packageVersion,
      },
    };
    const res = await axios.get(`${baseUrl}${versionInfoPath}`);
    expect(res.data).toMatchObject(expectedResponse);
  });
});
