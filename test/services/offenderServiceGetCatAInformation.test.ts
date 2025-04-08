/* eslint-disable @typescript-eslint/ban-ts-comment */

import serviceCreator from '../../server/services/offendersService'

const offenderNo = 'C3456RS'
const emptyResponse = { catAEndYear: null, catAStartYear: null, catAType: null, finalCat: null, releaseYear: null }
const nomisClient = {
  getCategoryHistory: jest.fn(),
  getSentenceHistory: jest.fn(),
}

const formService = {
  getCategorisationRecord: jest.fn(),
}

const nomisClientBuilder = () => nomisClient

// @ts-ignore
const service = serviceCreator(nomisClientBuilder, formService)

afterEach(() => {
  jest.resetAllMocks()
})

describe('getCatAInformation', () => {
  test('it should return previous Cat A and sentence information', async () => {
    const categories = [
      {
        bookingId: 45,
        offenderNo,
        classificationCode: 'A',
        classification: 'Cat A',
        assessmentDate: '2012-04-04',
        approvalDate: '2012-04-04',
        assessmentSeq: 2,
      },
      {
        bookingId: 45,
        offenderNo,
        classificationCode: 'B',
        classification: 'Cat B',
        assessmentDate: '2013-03-24',
        approvalDate: '2013-03-24',
        assessmentSeq: 3,
      },
    ]

    const sentences = [
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: 45, releaseDate: '2014-02-03' },
      },
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: 55, releaseDate: '2015-02-03' },
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(categories)
    nomisClient.getSentenceHistory.mockReturnValue(sentences)

    const result = await service.getCatAInformation('token', offenderNo, '55')
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).toBeCalledTimes(1)
    expect(result).toEqual({
      catAType: 'A',
      catAStartYear: '2012',
      catAEndYear: '2013',
      releaseYear: '2014',
      finalCat: 'Cat B',
    })
  })

  test('it should handle no previous', async () => {
    nomisClient.getCategoryHistory.mockReturnValue([])

    const result = await service.getCatAInformation('token', offenderNo, '0')
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).not.toBeCalled()
    expect(result).toEqual(emptyResponse)
  })

  test('it should handle previous but no Cat A', async () => {
    const categories = [
      {
        bookingId: 45,
        offenderNo,
        classificationCode: 'B',
        classification: 'Cat B',
        assessmentCode: 'CATEGORY',
        assessmentDescription: 'Categorisation',
        cellSharingAlertFlag: false,
        assessmentDate: '2013-03-24',
        nextReviewDate: '2013-09-17',
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(categories)

    const result = await service.getCatAInformation('token', offenderNo, '45')
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).not.toBeCalled()
    expect(result).toEqual(emptyResponse)
  })

  test('it should handle Cat A not the first cat', async () => {
    const categories = [
      {
        bookingId: 45,
        offenderNo,
        classificationCode: 'B',
        classification: 'Cat B',
        approvalDate: '2013-03-24',
        assessmentSeq: 2,
      },
      {
        bookingId: 45,
        offenderNo,
        classificationCode: 'A',
        classification: 'Cat A',
        approvalDate: '2014-04-04',
        assessmentSeq: 3,
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(categories)

    const result = await service.getCatAInformation('token', offenderNo, '45')
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).not.toBeCalled()
    expect(result).toEqual({
      catAType: 'A',
      catAStartYear: '2014',
      catAEndYear: null,
      releaseYear: null,
      finalCat: 'Cat A',
    })
  })

  test('it should handle no sentence info', async () => {
    const categories = [
      {
        bookingId: 45,
        offenderNo,
        classificationCode: 'A',
        classification: 'Cat A',
        approvalDate: '2012-04-04',
        assessmentSeq: 3,
      },
      {
        bookingId: 45,
        offenderNo,
        classificationCode: 'B',
        classification: 'Cat B',
        approvalDate: '2013-03-24',
        assessmentSeq: 4,
      },
      {
        bookingId: 55,
        offenderNo,
        classificationCode: 'C',
        classification: 'Cat C',
        approvalDate: '2014-03-24',
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(categories)
    nomisClient.getSentenceHistory.mockReturnValue([])

    const result = await service.getCatAInformation('token', offenderNo, '55')
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).toBeCalledTimes(1)
    expect(result).toEqual({
      catAType: 'A',
      catAStartYear: '2012',
      catAEndYear: '2013',
      releaseYear: null,
      finalCat: 'Cat B',
    })
  })

  test('it should find correct Cat A and sentence information from a long unsorted list', async () => {
    const categories = [
      {
        bookingId: 55,
        offenderNo,
        classificationCode: 'D',
        classification: 'Cat D',
        approvalDate: '2015-04-04',
        assessmentSeq: 7,
      },
      {
        bookingId: 35,
        offenderNo,
        classificationCode: 'C',
        classification: 'Cat C',
        approvalDate: '2010-04-04',
        assessmentSeq: 2,
      },
      {
        bookingId: 45,
        offenderNo,
        classificationCode: 'B',
        classification: 'Cat B',
        approvalDate: '2013-03-24',
        assessmentSeq: 4,
      },
      {
        bookingId: 35,
        offenderNo,
        classificationCode: 'B',
        classification: 'Cat B',
        approvalDate: '2011-03-24',
        assessmentSeq: 6,
      },
      {
        bookingId: 45,
        offenderNo,
        classificationCode: 'A',
        classification: 'Cat A',
        approvalDate: '2012-04-04',
        assessmentSeq: 3,
      },
    ]

    const sentences = [
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: 35, releaseDate: '2011-02-03' },
      },
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: 45, releaseDate: '2014-02-03' },
      },
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: 55, releaseDate: '2015-02-03' },
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(categories)
    nomisClient.getSentenceHistory.mockReturnValue(sentences)

    const result = await service.getCatAInformation('token', offenderNo, '55')
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).toBeCalledTimes(1)
    expect(result).toEqual({
      catAType: 'A',
      catAStartYear: '2012',
      catAEndYear: '2013',
      releaseYear: '2014',
      finalCat: 'Cat B',
    })
  })

  test('it should find last Cat A of several', async () => {
    const categories = [
      {
        bookingId: 1,
        offenderNo,
        classificationCode: 'A',
        classification: 'Cat A',
        approvalDate: '2010-04-04',
        assessmentSeq: 7,
      },
      {
        bookingId: 2,
        offenderNo,
        classificationCode: 'C',
        classification: 'Cat C',
        approvalDate: '2011-04-04',
        assessmentSeq: 2,
      },
      {
        bookingId: 3,
        offenderNo,
        classificationCode: 'H',
        classification: 'Cat A high',
        approvalDate: '2012-03-24',
        assessmentSeq: 4,
      },
      {
        bookingId: 3,
        offenderNo,
        classificationCode: 'B',
        classification: 'Cat B',
        approvalDate: '2013-03-24',
        assessmentSeq: 6,
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(categories)

    const result = await service.getCatAInformation('token', offenderNo, '3')
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).not.toBeCalled()
    expect(result).toEqual({
      catAType: 'H',
      catAStartYear: '2012',
      catAEndYear: '2013',
      releaseYear: null,
      finalCat: 'Cat B',
    })
  })

  test('it should omit release when cat A is in current sentence', async () => {
    const categories = [
      {
        bookingId: 35,
        offenderNo,
        classificationCode: 'A',
        classification: 'Cat A',
        approvalDate: '2010-04-04',
        assessmentSeq: 3,
      },
      {
        bookingId: 35,
        offenderNo,
        classificationCode: 'B',
        classification: 'Cat B',
        approvalDate: '2011-03-24',
        assessmentSeq: 6,
      },
    ]

    const sentences = [
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: 35, releaseDate: '2011-02-03' },
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(categories)
    nomisClient.getSentenceHistory.mockReturnValue(sentences)

    const result = await service.getCatAInformation('token', offenderNo, '35')
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).not.toBeCalled()
    expect(result).toEqual({
      catAType: 'A',
      catAStartYear: '2010',
      catAEndYear: '2011',
      releaseYear: null,
      finalCat: 'Cat B',
    })
  })
})

describe('getCatAInformation for female prison', () => {
  test('it should return previous Restricted and sentence information', async () => {
    const categories = [
      {
        bookingId: 45,
        offenderNo,
        classificationCode: 'Q',
        classification: 'Restricted',
        assessmentDate: '2012-04-04',
        approvalDate: '2012-04-04',
        assessmentSeq: 2,
      },
      {
        bookingId: 45,
        offenderNo,
        classificationCode: 'R',
        classification: 'Fem Closed',
        assessmentDate: '2013-03-24',
        approvalDate: '2013-03-24',
        assessmentSeq: 3,
      },
      {
        bookingId: 45,
        offenderNo,
        classificationCode: 'T',
        classification: 'Fem Open',
        assessmentDate: '2014-03-24',
        approvalDate: '2014-03-24',
        assessmentSeq: 4,
      },
    ]

    const sentences = [
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: 45, releaseDate: '2014-12-03' },
      },
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: 55, releaseDate: '2015-12-03' },
      },
    ]
    nomisClient.getCategoryHistory.mockReturnValue(categories)
    nomisClient.getSentenceHistory.mockReturnValue(sentences)

    const result = await service.getCatAInformation('token', offenderNo, '56')
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).toBeCalledTimes(1)
    expect(result).toEqual({
      catAType: 'Q',
      catAStartYear: '2012',
      catAEndYear: '2013',
      releaseYear: '2014',
      finalCat: 'Fem Open',
    })
  })

  test('it should handle restricted as not the first cat', async () => {
    const categories = [
      {
        bookingId: 45,
        offenderNo,
        classificationCode: 'R',
        classification: 'Fem Closed',
        approvalDate: '2015-03-24',
        assessmentSeq: 2,
      },
      {
        bookingId: 45,
        offenderNo,
        classificationCode: 'Q',
        classification: 'Restricted',
        approvalDate: '2016-04-04',
        assessmentSeq: 3,
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(categories)

    const result = await service.getCatAInformation('token', offenderNo, '45')
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).not.toBeCalled()
    expect(result).toEqual({
      catAType: 'Q',
      catAStartYear: '2016',
      catAEndYear: null,
      releaseYear: null,
      finalCat: 'Restricted',
    })
  })

  test('it should omit release when Restricted is in current sentence', async () => {
    const categories = [
      {
        bookingId: 35,
        offenderNo,
        classificationCode: 'Q',
        classification: 'Restricted',
        approvalDate: '2011-04-04',
        assessmentSeq: 3,
      },
      {
        bookingId: 35,
        offenderNo,
        classificationCode: 'R',
        classification: 'Fem Closed',
        approvalDate: '2012-03-24',
        assessmentSeq: 6,
      },
    ]

    const sentences = [
      {
        offenderNo,
        firstName: 'firstName',
        lastName: 'lastName',
        sentenceDetail: { bookingId: 35, releaseDate: '2012-02-03' },
      },
    ]

    nomisClient.getCategoryHistory.mockReturnValue(categories)
    nomisClient.getSentenceHistory.mockReturnValue(sentences)

    const result = await service.getCatAInformation('token', offenderNo, '35')
    expect(nomisClient.getCategoryHistory).toBeCalledTimes(1)
    expect(nomisClient.getSentenceHistory).not.toBeCalled()
    expect(result).toEqual({
      catAType: 'Q',
      catAStartYear: '2011',
      catAEndYear: '2012',
      releaseYear: null,
      finalCat: 'Fem Closed',
    })
  })
})
