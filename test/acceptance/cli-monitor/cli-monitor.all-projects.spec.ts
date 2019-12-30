import * as sinon from 'sinon';

interface AcceptanceTests {
  language: string;
  tests: {
    [name: string]: any;
  };
}

export const AllProjectsTests: AcceptanceTests = {
  language: 'Mixed (Ruby & Npm & Maven)',
  tests: {
    '`monitor mono-repo-project with lockfiles --all-projects`': (
      params,
      utils,
    ) => async (t) => {
      utils.chdirWorkspaces();
      const spyPlugin = sinon.spy(params.plugins, 'loadPlugin');
      t.teardown(spyPlugin.restore);

      const result = await params.cli.monitor('mono-repo-project', {
        allProjects: true,
      });
      t.ok(spyPlugin.withArgs('rubygems').calledOnce, 'calls rubygems plugin');
      t.ok(spyPlugin.withArgs('npm').calledOnce, 'calls npm plugin');
      t.ok(spyPlugin.withArgs('maven').calledOnce, 'calls maven plugin');
      // npm
      t.match(
        result,
        'npm/graph/some/project-id',
        'npm project was monitored (via graph endpoint)',
      );
      // rubygems
      t.match(
        result,
        'rubygems/some/project-id',
        'rubygems project was monitored',
      );

      // maven
      t.match(result, 'maven/some/project-id', 'maven project was monitored ');
      // Pop all calls to server and filter out calls to `featureFlag` endpoint
      const requests = params.server
        .popRequests(4)
        .filter((req) => req.url.includes('/monitor/'));
      t.equal(requests.length, 3, 'Correct amount of monitor requests');

      requests.forEach((req) => {
        t.match(req.url, '/monitor/', 'puts at correct url');
        t.notOk(req.body.targetFile, "doesn't send the targetFile");
        t.equal(req.method, 'PUT', 'makes PUT request');
        t.equal(
          req.headers['x-snyk-cli-version'],
          params.versionNumber,
          'sends version number',
        );
      });
    },
    '`monitor maven-multi-app --all-projects`': (params, utils) => async (
      t,
    ) => {
      utils.chdirWorkspaces();
      const spyPlugin = sinon.spy(params.plugins, 'loadPlugin');
      t.teardown(spyPlugin.restore);

      const result = await params.cli.monitor('maven-multi-app', {
        allProjects: true,
      });
      t.ok(
        spyPlugin.withArgs('rubygems').notCalled,
        'did not call rubygems plugin',
      );
      t.ok(spyPlugin.withArgs('npm').notCalled, 'did not call npm plugin');
      t.ok(spyPlugin.withArgs('maven').calledOnce, 'calls maven plugin');
      // maven
      t.match(result, 'maven/some/project-id', 'maven project was monitored ');
      // Pop all calls to server and filter out calls to `featureFlag` endpoint
      const requests = params.server
        .popRequests(2)
        .filter((req) => req.url.includes('/monitor/'));
      t.equal(requests.length, 1, 'Correct amount of monitor requests');

      requests.forEach((req) => {
        t.match(req.url, '/monitor/', 'puts at correct url');
        t.notOk(req.body.targetFile, "doesn't send the targetFile");
        t.equal(req.method, 'PUT', 'makes PUT request');
        t.equal(
          req.headers['x-snyk-cli-version'],
          params.versionNumber,
          'sends version number',
        );
      });
    },
    '`monitor monorepo-bad-project --all-projects`': (params, utils) => async (
      t,
    ) => {
      utils.chdirWorkspaces();
      const spyPlugin = sinon.spy(params.plugins, 'loadPlugin');
      t.teardown(spyPlugin.restore);

      const result = await params.cli.monitor('monorepo-bad-project', {
        allProjects: true,
      });
      t.ok(spyPlugin.withArgs('rubygems').calledOnce, 'calls rubygems plugin');
      t.ok(spyPlugin.withArgs('yarn').calledOnce, 'calls npm plugin');
      t.ok(spyPlugin.withArgs('maven').notCalled, 'did not call  maven plugin');

      // rubygems
      t.match(
        result,
        'rubygems/some/project-id',
        'rubygems project was monitored',
      );
      // yarn
      // yarn project fails with OutOfSyncError, no monitor output shown
      // Pop all calls to server and filter out calls to `featureFlag` endpoint
      // TODO: bump this test to discover both pom.xml in the repo
      // once we have depth increase released
      const requests = params.server
        .popRequests(2)
        .filter((req) => req.url.includes('/monitor/'));
      t.equal(requests.length, 1, 'Correct amount of monitor requests');

      requests.forEach((req) => {
        t.match(req.url, '/monitor/', 'puts at correct url');
        t.notOk(req.body.targetFile, "doesn't send the targetFile");
        t.equal(req.method, 'PUT', 'makes PUT request');
        t.equal(
          req.headers['x-snyk-cli-version'],
          params.versionNumber,
          'sends version number',
        );
      });
    },

    // TODO: do we need a test with --json?
  },
};