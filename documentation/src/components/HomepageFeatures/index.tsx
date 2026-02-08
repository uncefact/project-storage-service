import clsx from 'clsx';

const FeatureList = [
    {
        title: 'Standard Storage',
        Svg: require('@site/static/img/standard-storage-icon.svg').default,
        description: (
            <>
                Store and manage data with our basic storage API. Support multiple storage providers without additional
                complexity.
            </>
        ),
    },
    {
        title: 'Encrypted Storage',
        Svg: require('@site/static/img/encrypted-storage-icon.svg').default,
        description: (
            <>
                Keep your data secure with our encrypted storage solution. Built-in encryption ensures your data remains
                protected at rest.
            </>
        ),
    },
    {
        title: 'Provider Flexibility',
        Svg: require('@site/static/img/cloud-provider-icon.svg').default,
        description: (
            <>
                Choose from multiple storage providers or use local storage. Simple configuration lets you switch
                providers without code changes.
            </>
        ),
    },
    {
        title: 'Secure Cryptography',
        Svg: require('@site/static/img/compliance-icon.svg').default,
        description: (
            <>
                Protect your data with industry-standard SHA-256 hashing and AES-256-GCM encryption. Maintain data
                integrity and security across all storage operations.
            </>
        ),
    },
];

function Feature({ Svg, title, description }) {
    return (
        <div className={clsx('col col--3 home-feature')}>
            <div className="home-feature__content">
                <div className="home-feature__head">
                    <div className="home-feature__image">
                        <Svg className="home-feature__icon" role="img" />
                    </div>
                    <h3 className="home-feature__title">{title}</h3>
                </div>
                <p className="home-feature__description">{description}</p>
            </div>
        </div>
    );
}

export default function HomepageFeatures() {
    return (
        <section className="home-features">
            <div className="home-features__container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
