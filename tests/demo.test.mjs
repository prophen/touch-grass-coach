import test from 'node:test';
import assert from 'node:assert/strict';
import { RequestLimiter, readSmallJson } from '../lib/request-limit.ts';
import { parseCoachResponse } from '../lib/coach-response.ts';

test('requests are limited independently and reset after the window', () => {
  const limiter = new RequestLimiter(2, 60000);
  assert.equal(limiter.check('a', 0), 0);
  assert.equal(limiter.check('a', 1), 0);
  assert.equal(limiter.check('a', 1000), 59);
  assert.equal(limiter.check('b', 1000), 0);
  assert.equal(limiter.check('a', 60000), 0);
});
test('flooding new identities cannot evict live limits', () => {
  const limiter = new RequestLimiter(1, 60000, 2);
  limiter.check('a', 0); limiter.check('b', 0);
  assert.equal(limiter.check('c', 1), 60);
  assert.equal(limiter.check('a', 1), 60);
});
test('oversized chunked bodies are rejected without trusting Content-Length', async () => {
  const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('x'.repeat(4097))); controller.close(); } });
  await assert.rejects(readSmallJson(new Request('http://localhost', {method:'POST', body, duplex:'half'})), /Body too large/);
  assert.deepEqual(await readSmallJson(new Request('http://localhost', {method:'POST', body:'{"hours":3}'})), {hours:3});
});
test('model answers exclude thoughts and reject empty or malformed fields', () => {
  const answer = parts => ({candidates:[{content:{parts}}]});
  assert.deepEqual(parseCoachResponse(answer([{thought:true,text:'private thought'}, {text:'```json\n{"roast":"Hi",'}, {text:'"mission":"Look at a cloud."}\n```'}])), {roast:'Hi',mission:'Look at a cloud.'});
  for (const data of [null, answer([]), answer([{text:'{"roast":"", "mission":"go"}'}]), answer([{text:'{"roast":null,"mission":"go"}'}]), answer([{text:'not json'}])]) assert.throws(() => parseCoachResponse(data));
});
