// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import fetchMeta from "fetch-meta-tags";

export default async function handler(req, res) {
  const { website, api } = req.query;
  // console.log(query)
  // console.log(website)
  if (api == process.env.NEXT_PUBLIC_APP_API_KEY) {
    const results = await searchPipeline(website);
    let resultObj = {};
    if (results.length > 0) {
      resultObj = {
        status: "FOUND",
        query: website,
        count: results.length,
        results,
      };
    } else {
      let metaTags = {};
      try {
        metaTags = await fetchMeta(`https://${website}`);
      } catch (e) {
        metaTags = { status: e };
      }
      resultObj = {
        status: "NOT FOUND",
        query: website,
        message: `${website} does not exist in the pipeline, follow the link below to create it.`,
        url: `https://airtable.com/shrUB5NNy0PGzPjQT?prefill_Website=https://${encodeURI(
          website
        )}${
          metaTags.description
            ? "&prefill_Description=".concat(encodeURI(metaTags.description))
            : ""
        }`,
        metaTags,
      };
    }
    res.status(200).json(resultObj);
  } else {
    res.status(401).json({ message: "no api key..." });
  }
}

const searchPipeline = async (domain) => {
  console.log(domain);

  // set headers for call

  let myHeaders = new Headers();
  myHeaders.append(
    "Authorization",
    `Bearer ${process.env.NEXT_PUBLIC_AIRTABLE_API_KEY}`
  );
  myHeaders.append("Cookie", "brw=brwy1TrDiZyNAsU5u");

  let requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };
  // console.log(domain)
  // const AIRTABLE_URL =
  //   `https://api.airtable.com/v0/apptcOM65nkIWJy1l/Pipeline?filterByFormula=lower({domain})="${domain.toLowerCase()}"`;
  // const AIRTABLE_URL =
  //   `https://api.airtable.com/v0/apptcOM65nkIWJy1l/Pipeline?filterByFormula=SEARCH("${domain.toLowerCase()}", {domain})`;

  const AIRTABLE_URL = `https://api.airtable.com/v0/apptcOM65nkIWJy1l/Pipeline?filterByFormula=SEARCH("${domain}", lower({Website}))`;

  const res = await fetch(AIRTABLE_URL, requestOptions);
  // console.log(res)
  const data = await res.json();
  // console.log(data)

  // return data;

  let structuredData = data.records.map((company) => {
    return {
      name: company.fields.Name,
      url: company.fields.Website,
      description: company.fields.Description,
      fund: company.fields.Fund
        ? company.fields.Fund[0]
        : "Fund not set yet...",
      status: company.fields.Status ? company.fields.Status : "No status...",
      lastStatusChange: company.fields["Last Status Change"],
      urlToItem: `https://airtable.com/apptcOM65nkIWJy1l/tblltzjPiwy7gOkKE/${company.id}`,
      // airtableURL: company.fields
    };
  });

  return structuredData;
};
